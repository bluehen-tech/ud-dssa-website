import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DripServiceError, transitionCampaign } from "@/lib/drip-service";

const NOW = new Date("2026-10-30T12:00:00Z");
const ENV = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "CRON_SECRET", "UNSUBSCRIBE_TOKEN_SECRET"];

function campaignRow(status: string) {
  return {
    id: "c1", name: "N", status, email_type: "event", event_title: "T", event_date: "2026-11-20", event_time: "18:00:00",
    timezone: "America/New_York", event_starts_at: "2026-11-20T23:00:00Z", goal: null, brief: {}, audience_filter: {}, launched_at: null,
  };
}

function stepRow(approved: boolean, sendAt = "2026-11-06T14:00:00Z") {
  return {
    position: 1, stage: "save-the-date", subject: "S", body_markdown: "B", offset_days: -14, send_time: "09:00:00",
    send_at: sendAt, approved_at: approved ? "2026-10-29T00:00:00Z" : null,
  };
}

function fakeAdmin(opts: { status: string; steps: ReturnType<typeof stepRow>[]; enrolled: number; updateMatches?: boolean }) {
  const rpcCalls: string[] = [];
  const updates: unknown[] = [];
  const admin = {
    rpc: async (fn: string) => {
      rpcCalls.push(fn);
      return { data: fn === "drip_campaign_stats" ? { enrollments: {}, sends: {} } : null, error: null };
    },
    from: (table: string) => {
      const b: any = {
        select: () => b,
        eq: () => (table === "drip_enrollments" ? Promise.resolve({ count: opts.enrolled, error: null }) : b),
        order: () => Promise.resolve({ data: opts.steps, error: null }),
        maybeSingle: async () => ({ data: campaignRow(opts.status), error: null }),
        update: (patch: unknown) => (updates.push(patch), b),
        in: () => b,
        then: (resolve: (v: unknown) => unknown) => resolve({ data: opts.updateMatches === false ? [] : [{ id: "c1" }], error: null }),
      };
      return b;
    },
  } as unknown as SupabaseClient;
  return { admin, rpcCalls, updates };
}

describe("transitionCampaign", () => {
  beforeEach(() => ENV.forEach((k) => (process.env[k] = "x")));
  afterEach(() => ENV.forEach((k) => delete process.env[k]));

  it("refuses to launch while any step is unapproved and never calls the launch function", async () => {
    const { admin, rpcCalls } = fakeAdmin({ status: "draft", steps: [stepRow(false)], enrolled: 5 });
    const err = await transitionCampaign(admin, "c1", "launch", NOW).catch((e) => e);
    expect(err).toBeInstanceOf(DripServiceError);
    expect(err.status).toBe(422);
    expect(err.details.join(" ")).toMatch(/not been approved/);
    expect(rpcCalls).not.toContain("drip_launch_campaign");
  });

  it("refuses to launch with an empty audience or a past step", async () => {
    const empty = fakeAdmin({ status: "draft", steps: [stepRow(true)], enrolled: 0 });
    await expect(transitionCampaign(empty.admin, "c1", "launch", NOW)).rejects.toMatchObject({ status: 422 });

    const past = fakeAdmin({ status: "draft", steps: [stepRow(true, "2026-10-01T00:00:00Z")], enrolled: 3 });
    await expect(transitionCampaign(past.admin, "c1", "launch", NOW)).rejects.toMatchObject({ status: 422 });
  });

  it("launches an approved, scheduled draft through the locked SQL function", async () => {
    const { admin, rpcCalls } = fakeAdmin({ status: "draft", steps: [stepRow(true)], enrolled: 3 });
    await transitionCampaign(admin, "c1", "launch", NOW);
    expect(rpcCalls).toContain("drip_launch_campaign");
  });

  it("refuses to launch when the server is missing required configuration", async () => {
    delete process.env.CRON_SECRET;
    const { admin, rpcCalls } = fakeAdmin({ status: "draft", steps: [stepRow(true)], enrolled: 3 });
    const err = await transitionCampaign(admin, "c1", "launch", NOW).catch((e) => e);
    expect(err.status).toBe(503);
    expect(err.message).toContain("CRON_SECRET");
    expect(rpcCalls).not.toContain("drip_launch_campaign");
  });

  it("reports an illegal transition as a conflict", async () => {
    const { admin } = fakeAdmin({ status: "draft", steps: [stepRow(true)], enrolled: 3, updateMatches: false });
    await expect(transitionCampaign(admin, "c1", "pause", NOW)).rejects.toMatchObject({ status: 409 });
  });

  it("pauses an active campaign", async () => {
    const { admin, updates } = fakeAdmin({ status: "active", steps: [stepRow(true)], enrolled: 3 });
    await transitionCampaign(admin, "c1", "pause", NOW);
    expect(updates[0]).toMatchObject({ status: "paused" });
  });

  it("returns 404 for an unknown campaign", async () => {
    const admin = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) } as unknown as SupabaseClient;
    await expect(transitionCampaign(admin, "nope", "pause", NOW)).rejects.toMatchObject({ status: 404 });
  });
});
