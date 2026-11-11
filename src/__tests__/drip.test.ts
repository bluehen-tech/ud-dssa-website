import { describe, expect, it } from "vitest";
import {
  computeSendAt,
  launchBlockers,
  nextCampaignStatus,
  parseRecipientLine,
  validateCampaignInput,
  zonedTimeToUtc,
  type CampaignAction,
  type CampaignStatus,
} from "@/lib/drip";

const NOW = new Date("2026-10-30T12:00:00Z");

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Fall Mixer",
    eventTitle: "Fall Mixer",
    eventDate: "2026-11-20",
    eventTime: "18:00",
    timezone: "America/New_York",
    goal: "Fill the room",
    brief: { details: "Room 101", tone: "friendly-professional" },
    audience: { recipients: ["Ann Lee <Ann@udel.edu>", "bob@udel.edu"] },
    steps: [
      { stage: "save-the-date", subject: "Save the date", bodyMarkdown: "Hi {name}", offsetDays: -14, sendTime: "09:00", approved: true },
      { stage: "reminder", subject: "Reminder", bodyMarkdown: "Hi {name}", offsetDays: -3, sendTime: "09:00", approved: true },
    ],
    ...overrides,
  };
}

describe("time zone scheduling", () => {
  it("converts wall-clock time in the campaign zone to UTC", () => {
    expect(zonedTimeToUtc("2026-06-01", "09:00", "Asia/Tokyo").toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(zonedTimeToUtc("2026-07-01", "09:00", "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(zonedTimeToUtc("2026-12-01", "09:00", "America/New_York").toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });

  it("keeps the local send time across a DST change (US fall back on 2026-11-01)", () => {
    // Event on 2026-11-08 (EST); 14 days earlier is 2026-10-25 (still EDT).
    const sendAt = computeSendAt("2026-11-08", -14, "09:00", "America/New_York");
    expect(sendAt.toISOString()).toBe("2026-10-25T13:00:00.000Z"); // 09:00 EDT, not 08:00
    // A naive 14 * 24h subtraction from 09:00 EST would land an hour off.
    const eventLocal9 = zonedTimeToUtc("2026-11-08", "09:00", "America/New_York");
    expect(eventLocal9.getTime() - 14 * 24 * 3600_000).not.toBe(sendAt.getTime());
  });

  it("day-of offset uses the event's local date", () => {
    expect(computeSendAt("2026-11-20", 0, "08:00", "America/New_York").toISOString()).toBe("2026-11-20T13:00:00.000Z");
  });
});

describe("validateCampaignInput", () => {
  it("accepts a valid campaign and derives send times server-side", () => {
    const res = validateCampaignInput(validInput(), NOW);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.eventStartsAt.toISOString()).toBe("2026-11-20T23:00:00.000Z");
    expect(res.value.steps[0].sendAt.toISOString()).toBe("2026-11-06T14:00:00.000Z");
    expect(res.value.steps.map((s) => s.position)).toEqual([1, 2]);
  });

  it("de-duplicates recipients by address and parses Name <email> lines", () => {
    const res = validateCampaignInput(
      validInput({ audience: { recipients: ["Ann <ann@udel.edu>", "ANN@udel.edu", "bob@udel.edu"] } }),
      NOW
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.audience.recipients).toEqual(["Ann <ann@udel.edu>", "bob@udel.edu"]);
    expect(parseRecipientLine("Ann Lee <Ann@UDel.edu>")).toEqual({ email: "ann@udel.edu", name: "Ann Lee" });
    expect(parseRecipientLine("bob@udel.edu")).toEqual({ email: "bob@udel.edu", name: "" });
    expect(parseRecipientLine("nope")).toBeNull();
  });

  it("ignores client-supplied status, recipients and send times", () => {
    const res = validateCampaignInput(
      validInput({ status: "active", recipients: ["x@y.com"], steps: [{ ...validInput().steps[0], sendAt: "2020-01-01T00:00:00Z" }] }),
      NOW
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).not.toHaveProperty("status");
    expect(res.value).not.toHaveProperty("recipients");
    expect(res.value.steps[0].sendAt.getUTCFullYear()).toBe(2026);
  });

  it.each([
    ["positive offset", { offsetDays: 1 }],
    ["fractional offset", { offsetDays: -1.5 }],
    ["offset too far back", { offsetDays: -400 }],
    ["string offset", { offsetDays: "-3" }],
    ["bad send time", { sendTime: "25:00" }],
    ["unknown stage", { stage: "upsell" }],
    ["empty subject", { subject: "  " }],
    ["empty body", { bodyMarkdown: "" }],
  ])("rejects a step with %s", (_label, patch) => {
    const input = validInput();
    input.steps[0] = { ...input.steps[0], ...patch } as (typeof input.steps)[number];
    expect(validateCampaignInput(input, NOW).ok).toBe(false);
  });

  it.each([
    ["impossible date", { eventDate: "2026-02-30" }],
    ["malformed date", { eventDate: "11/20/2026" }],
    ["bad time", { eventTime: "6pm" }],
    ["unknown time zone", { timezone: "Mars/Olympus" }],
    ["event in the past", { eventDate: "2026-10-01" }],
    ["no recipients", { audience: { recipients: [] } }],
    ["missing audience", { audience: undefined }],
    ["malformed recipient", { audience: { recipients: ["not-an-email"] } }],
    ["recipient with spaces", { audience: { recipients: ["a b@udel.edu"] } }],
    ["no steps", { steps: [] }],
    ["too many steps", { steps: Array.from({ length: 9 }, (_, i) => ({ ...validInput().steps[0], offsetDays: -20 + i })) }],
  ])("rejects %s", (_label, patch) => {
    expect(validateCampaignInput(validInput(patch), NOW).ok).toBe(false);
  });

  it("rejects steps that are out of order or not before the event", () => {
    const outOfOrder = validInput({ steps: [validInput().steps[1], validInput().steps[0]] });
    expect(validateCampaignInput(outOfOrder, NOW).ok).toBe(false);

    const lateStep = validInput({
      steps: [{ ...validInput().steps[0], offsetDays: 0, sendTime: "19:00" }], // event starts 18:00 local
    });
    const res = validateCampaignInput(lateStep, NOW);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/before the event starts/);
  });

  it("rejects non-object bodies", () => {
    expect(validateCampaignInput(null, NOW).ok).toBe(false);
    expect(validateCampaignInput("nope", NOW).ok).toBe(false);
  });
});

describe("campaign state machine", () => {
  const allStatuses: CampaignStatus[] = ["draft", "active", "paused", "completed", "cancelled"];
  const expected: Record<CampaignAction, Partial<Record<CampaignStatus, CampaignStatus>>> = {
    launch: { draft: "active" },
    pause: { active: "paused" },
    resume: { paused: "active" },
    cancel: { draft: "cancelled", active: "cancelled", paused: "cancelled" },
  };

  for (const action of Object.keys(expected) as CampaignAction[]) {
    for (const status of allStatuses) {
      const want = expected[action][status] ?? null;
      it(`${action} from ${status} -> ${want ?? "rejected"}`, () => {
        expect(nextCampaignStatus(status, action)).toBe(want);
      });
    }
  }
});

describe("launchBlockers", () => {
  const future = new Date("2026-11-06T14:00:00Z");
  const base = {
    status: "draft" as CampaignStatus,
    eventStartsAt: new Date("2026-11-20T23:00:00Z"),
    steps: [{ approved: true, sendAt: future }],
    audienceCount: 10,
  };

  it("is empty for a ready campaign", () => {
    expect(launchBlockers(base, NOW)).toEqual([]);
  });

  it("requires human approval of every step", () => {
    expect(launchBlockers({ ...base, steps: [{ approved: false, sendAt: future }] }, NOW)).toHaveLength(1);
  });

  it("blocks past steps, empty audiences, and non-drafts", () => {
    expect(launchBlockers({ ...base, steps: [{ approved: true, sendAt: new Date("2026-10-01T00:00:00Z") }] }, NOW)).not.toEqual([]);
    expect(launchBlockers({ ...base, audienceCount: 0 }, NOW)).not.toEqual([]);
    expect(launchBlockers({ ...base, status: "active" }, NOW)).not.toEqual([]);
  });
});
