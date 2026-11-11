import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  generateEmail: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase-admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/uddssaMailer", () => ({ generateEmail: mocks.generateEmail }));

import { POST as generatePost } from "@/app/api/email/generate/route";
import { POST as unsubscribePost } from "@/app/api/unsubscribe/route";
import { signUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

function adminSession() {
  return {
    auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { admin_flag: true } }) }) }) }),
  };
}

function req(url: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/email/generate", () => {
  beforeEach(() => {
    mocks.createClient.mockReturnValue(adminSession());
    mocks.generateEmail.mockResolvedValue({ subject: "S", body: "B" });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("passes sequence stage and previous-step context through to the generator", async () => {
    const res = await generatePost(
      req("/api/email/generate", {
        contentMode: "ai_draft",
        draftInput: {
          type: "event",
          audience: "grads",
          topic: "Mixer",
          details: "Nov 20",
          cta: "RSVP",
          sequence: {
            goal: "Fill the room",
            stage: "reminder",
            stageIndex: 2,
            totalSteps: 4,
            previousSteps: [{ stage: "save-the-date", subject: "Save the date", body: "x".repeat(5000), junk: "dropped" }],
          },
        },
      })
    );

    expect(res.status).toBe(200);
    const sent = mocks.generateEmail.mock.calls[0][0];
    expect(sent.draftInput.sequence).toMatchObject({ stage: "reminder", stageIndex: 2, totalSteps: 4, goal: "Fill the room" });
    expect(sent.draftInput.sequence.previousSteps[0].body.length).toBe(1500);
    expect(sent.draftInput.sequence.previousSteps[0]).not.toHaveProperty("junk");
  });

  it("drops an unknown sequence stage and leaves single-email generation unchanged", async () => {
    await generatePost(
      req("/api/email/generate", {
        contentMode: "ai_draft",
        draftInput: { type: "event", audience: "", topic: "T", details: "D", cta: "", sequence: { stage: "spam" } },
      })
    );
    expect(mocks.generateEmail.mock.calls[0][0].draftInput.sequence).toBeUndefined();

    mocks.generateEmail.mockClear();
    const manual = await generatePost(req("/api/email/generate", { contentMode: "manual", subject: "S", body: "B" }));
    expect(manual.status).toBe(200);
    expect(await manual.json()).toMatchObject({ success: true, subject: "S", body: "B" });
    expect(mocks.generateEmail.mock.calls[0][0]).toMatchObject({ contentMode: "manual", subject: "S", body: "B" });
  });
});

describe("buildDraftUserMessage (real implementation)", () => {
  it("includes sequence stage, goal and previous emails, and the no-invention rule", async () => {
    const { buildDraftUserMessage } = await vi.importActual<typeof import("@/lib/uddssaMailer")>("@/lib/uddssaMailer");
    const base = { type: "event", audience: "grads", topic: "Mixer", details: "Nov 20, Room 101", cta: "RSVP" };

    const single = buildDraftUserMessage(base);
    expect(single).not.toContain("SEQUENCE");

    const seq = buildDraftUserMessage({
      ...base,
      sequence: {
        goal: "Fill the room",
        stage: "reminder",
        stageIndex: 2,
        totalSteps: 4,
        previousSteps: [{ stage: "save-the-date", subject: "Save the date", body: "Mark your calendar" }],
      },
    });
    expect(seq).toContain("email 3 of 4");
    expect(seq).toContain("Stage: reminder");
    expect(seq).toContain("Fill the room");
    expect(seq).toContain('"Save the date"');
    expect(seq).toMatch(/Do not invent/);
  });
});

describe("unsubscribe tokens", () => {
  beforeEach(() => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret";
  });
  afterEach(() => {
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
    delete process.env.UNSUBSCRIBE_REQUIRE_TOKEN;
    vi.clearAllMocks();
  });

  it("verifies only the exact (email, list) pair it was minted for", () => {
    const token = signUnsubscribeToken("Ann@UDel.edu", "event")!;
    expect(verifyUnsubscribeToken("ann@udel.edu", "event", token)).toBe(true);
    expect(verifyUnsubscribeToken("bob@udel.edu", "event", token)).toBe(false);
    expect(verifyUnsubscribeToken("ann@udel.edu", "all", token)).toBe(false);
    expect(verifyUnsubscribeToken("ann@udel.edu", "event", token.slice(0, -2) + "xx")).toBe(false);
    expect(verifyUnsubscribeToken("ann@udel.edu", "event", "")).toBe(false);
  });

  it("returns no token (and verifies nothing) when no secret is configured", () => {
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
    expect(signUnsubscribeToken("a@b.c", "event")).toBeNull();
    expect(verifyUnsubscribeToken("a@b.c", "event", "anything")).toBe(false);
  });

  function recorder() {
    const calls: string[] = [];
    return {
      calls,
      client: {
        from: () => ({
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          insert: (row: unknown) => {
            calls.push(JSON.stringify(row));
            return { select: () => ({ single: async () => ({ data: row, error: null }) }) };
          },
        }),
      },
    };
  }

  it("rejects a forged token without touching the database", async () => {
    const anon = recorder();
    const admin = recorder();
    mocks.createClient.mockReturnValue(anon.client);
    mocks.createAdminClient.mockReturnValue(admin.client);

    const res = await unsubscribePost(req("/api/unsubscribe", { email: "victim@udel.edu", list: "all", token: "forged" }));
    expect(res.status).toBe(403);
    expect(anon.calls).toHaveLength(0);
    expect(admin.calls).toHaveLength(0);
  });

  it("accepts a valid token and writes with the service-role client", async () => {
    const anon = recorder();
    const admin = recorder();
    mocks.createClient.mockReturnValue(anon.client);
    mocks.createAdminClient.mockReturnValue(admin.client);

    const token = signUnsubscribeToken("ann@udel.edu", "event")!;
    const res = await unsubscribePost(req("/api/unsubscribe", { email: "ann@udel.edu", list: "event", token }));
    expect(res.status).toBe(200);
    expect(admin.calls).toHaveLength(1);
    expect(JSON.parse(admin.calls[0]).source_metadata.unsubscribed_lists).toEqual(["event"]);
  });

  it("keeps legacy tokenless links working unless a token is required", async () => {
    const anon = recorder();
    mocks.createClient.mockReturnValue(anon.client);

    const legacy = await unsubscribePost(req("/api/unsubscribe", { email: "ann@udel.edu", list: "event" }));
    expect(legacy.status).toBe(200);

    process.env.UNSUBSCRIBE_REQUIRE_TOKEN = "true";
    const strict = await unsubscribePost(req("/api/unsubscribe", { email: "ann@udel.edu", list: "event" }));
    expect(strict.status).toBe(403);
  });
});
