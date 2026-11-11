import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  saveCampaign: vi.fn(),
  transitionCampaign: vi.fn(),
  listCampaigns: vi.fn(),
  getCampaign: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase-admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/drip-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/drip-service")>("@/lib/drip-service");
  return {
    ...actual,
    saveCampaign: mocks.saveCampaign,
    transitionCampaign: mocks.transitionCampaign,
    listCampaigns: mocks.listCampaigns,
    getCampaign: mocks.getCampaign,
  };
});

import { GET as listGet, POST as createPost } from "@/app/api/email/campaigns/route";
import { GET as detailGet, PUT as updatePut } from "@/app/api/email/campaigns/[id]/route";
import { POST as statusPost } from "@/app/api/email/campaigns/[id]/status/route";
import { DripServiceError } from "@/lib/drip-service";

const ID = "123e4567-e89b-42d3-a456-426614174000";

function session(kind: "anon" | "member" | "admin") {
  return {
    auth: {
      getUser: async () =>
        kind === "anon" ? { data: { user: null }, error: { message: "no session" } } : { data: { user: { id: "u1" } }, error: null },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { admin_flag: kind === "admin" } }) }) }),
    }),
  };
}

const validCampaign = {
  name: "Fall Mixer",
  eventTitle: "Fall Mixer",
  eventDate: "2099-11-20",
  eventTime: "18:00",
  timezone: "America/New_York",
  audience: { recipients: ["ann@udel.edu"] },
  steps: [{ stage: "save-the-date", subject: "S", bodyMarkdown: "B", offsetDays: -14, sendTime: "09:00", approved: true }],
};

const json = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });

afterEach(() => {
  vi.clearAllMocks();
});

describe("campaign endpoints require an admin on the server", () => {
  const calls: Array<[string, () => Promise<Response>]> = [
    ["list", () => listGet()],
    ["create", () => createPost(json("/api/email/campaigns", "POST", validCampaign))],
    ["read", () => detailGet(json(`/api/email/campaigns/${ID}`, "GET"), { params: { id: ID } })],
    ["edit", () => updatePut(json(`/api/email/campaigns/${ID}`, "PUT", validCampaign), { params: { id: ID } })],
    ["launch", () => statusPost(json(`/api/email/campaigns/${ID}/status`, "POST", { action: "launch" }), { params: { id: ID } })],
    ["pause", () => statusPost(json(`/api/email/campaigns/${ID}/status`, "POST", { action: "pause" }), { params: { id: ID } })],
  ];

  for (const [name, call] of calls) {
    it(`${name}: 401 when signed out`, async () => {
      mocks.createClient.mockReturnValue(session("anon"));
      expect((await call()).status).toBe(401);
    });

    it(`${name}: 403 for a signed-in non-admin, with no service call made`, async () => {
      mocks.createClient.mockReturnValue(session("member"));
      expect((await call()).status).toBe(403);
      for (const fn of [mocks.saveCampaign, mocks.transitionCampaign, mocks.listCampaigns, mocks.getCampaign]) {
        expect(fn).not.toHaveBeenCalled();
      }
    });
  }
});

describe("campaign endpoints as an admin", () => {
  it("creates a draft from a valid payload", async () => {
    mocks.createClient.mockReturnValue(session("admin"));
    mocks.saveCampaign.mockResolvedValue({ id: ID, audienceCount: 12, notFound: [], suppressed: 0 });

    const res = await createPost(json("/api/email/campaigns", "POST", { ...validCampaign, status: "active" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ success: true, id: ID, audienceCount: 12 });
    expect(mocks.saveCampaign.mock.calls[0][1]).toBe("u1");
    expect(mocks.saveCampaign.mock.calls[0][2]).toBeNull();
  });

  it("rejects invalid campaigns before touching the database", async () => {
    mocks.createClient.mockReturnValue(session("admin"));
    const bad = { ...validCampaign, steps: [{ ...validCampaign.steps[0], offsetDays: 3 }] };

    const res = await createPost(json("/api/email/campaigns", "POST", bad));
    expect(res.status).toBe(400);
    expect((await res.json()).details.join(" ")).toMatch(/offset/);
    expect(mocks.saveCampaign).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, ids and actions", async () => {
    mocks.createClient.mockReturnValue(session("admin"));

    const badJson = new NextRequest("http://localhost/api/email/campaigns", { method: "POST", body: "{nope" });
    expect((await createPost(badJson)).status).toBe(400);

    const badId = await updatePut(json("/api/email/campaigns/x", "PUT", validCampaign), { params: { id: "x" } });
    expect(badId.status).toBe(400);

    for (const action of ["delete", "active", undefined]) {
      const res = await statusPost(json(`/api/email/campaigns/${ID}/status`, "POST", { action }), { params: { id: ID } });
      expect(res.status).toBe(400);
    }
    expect(mocks.transitionCampaign).not.toHaveBeenCalled();
  });

  it("maps illegal state transitions to 409 and launch blockers to 422 with details", async () => {
    mocks.createClient.mockReturnValue(session("admin"));

    mocks.transitionCampaign.mockRejectedValueOnce(new DripServiceError("Cannot pause a campaign that is draft.", 409));
    const conflict = await statusPost(json(`/api/email/campaigns/${ID}/status`, "POST", { action: "pause" }), { params: { id: ID } });
    expect(conflict.status).toBe(409);

    mocks.transitionCampaign.mockRejectedValueOnce(new DripServiceError("This campaign cannot be launched yet.", 422, ["Step 1 has not been approved."]));
    const blocked = await statusPost(json(`/api/email/campaigns/${ID}/status`, "POST", { action: "launch" }), { params: { id: ID } });
    expect(blocked.status).toBe(422);
    expect((await blocked.json()).details).toEqual(["Step 1 has not been approved."]);
  });

  it("editing a non-draft is a 409 from the service", async () => {
    mocks.createClient.mockReturnValue(session("admin"));
    mocks.saveCampaign.mockRejectedValue(new DripServiceError("Only draft campaigns can be edited.", 409));
    const res = await updatePut(json(`/api/email/campaigns/${ID}`, "PUT", validCampaign), { params: { id: ID } });
    expect(res.status).toBe(409);
  });

  it("launch / pause pass only the named action to the service", async () => {
    mocks.createClient.mockReturnValue(session("admin"));
    mocks.transitionCampaign.mockResolvedValue({ id: ID, status: "active" });
    const res = await statusPost(json(`/api/email/campaigns/${ID}/status`, "POST", { action: "launch", status: "completed" }), {
      params: { id: ID },
    });
    expect(res.status).toBe(200);
    expect(mocks.transitionCampaign.mock.calls[0].slice(1)).toEqual([ID, "launch"]);
  });
});
