/**
 * Pure (no I/O) helpers for event drip campaigns: stage definitions, time-zone
 * aware scheduling, input validation, and the campaign state machine.
 * Safe to import from both server and client code.
 */

// ── Stages ───────────────────────────────────────────────────────────────────

export const DRIP_STAGES = ["save-the-date", "full-details", "reminder", "last-chance"] as const;
export type DripStage = (typeof DRIP_STAGES)[number];

export const STAGE_LABELS: Record<DripStage, string> = {
  "save-the-date": "Save the date",
  "full-details": "Full details",
  reminder: "Reminder",
  "last-chance": "Last chance",
};

/** Extra prompt guidance per stage (used as the `extras` field of the AI draft). */
export const STAGE_PROMPTS: Record<DripStage, string> = {
  "save-the-date":
    "This is an early save-the-date announcement. Keep it brief and exciting -- just the title, date, and a teaser.",
  "full-details": "This is the full event announcement with all details.",
  reminder: "This is a reminder email for an upcoming event. Create urgency -- the event is soon!",
  "last-chance":
    "This is a last-chance/day-of email. Strong urgency, FOMO, final call to attend.",
};

/** Suggested timing; offsetDays is days before the event date (0 = event day). */
export const DEFAULT_STAGE_TIMING: Record<DripStage, { offsetDays: number; sendTime: string }> = {
  "save-the-date": { offsetDays: -21, sendTime: "09:00" },
  "full-details": { offsetDays: -14, sendTime: "09:00" },
  reminder: { offsetDays: -3, sendTime: "09:00" },
  "last-chance": { offsetDays: 0, sendTime: "08:00" },
};

export const MAX_STEPS = 8;
export const MIN_OFFSET_DAYS = -365;

// ── Time zones ───────────────────────────────────────────────────────────────

export function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** Offset (minutes east of UTC) of `tz` at the given UTC instant. */
function tzOffsetMinutes(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - Math.floor(utcMs / 1000) * 1000) / 60000;
}

/**
 * Convert a wall-clock date/time in `tz` to the UTC instant it denotes.
 * Wall-clock times inside a spring-forward gap do not exist and resolve to a nearby valid instant.
 */
export function zonedTimeToUtc(date: string, time: string, tz: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, hh, mm);
  const firstGuess = naive - tzOffsetMinutes(naive, tz) * 60000;
  return new Date(naive - tzOffsetMinutes(firstGuess, tz) * 60000);
}

/** Calendar arithmetic on a YYYY-MM-DD string (no time zone involved). */
export function addDays(date: string, days: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * When a step is due: `offsetDays` calendar days from the event's local date,
 * at `sendTime` wall-clock in the campaign time zone (DST-safe).
 */
export function computeSendAt(eventDate: string, offsetDays: number, sendTime: string, tz: string): Date {
  return zonedTimeToUtc(addDays(eventDate, offsetDays), sendTime, tz);
}

// ── Input validation ─────────────────────────────────────────────────────────

/** The admin's recipient lines, exactly as entered ("email" or "Name <email>"). */
export interface AudienceInput {
  recipients: string[];
}

export const MAX_RECIPIENTS = 10000;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** Parse "Name <email>" or "email" into a normalised address; null if invalid. */
export function parseRecipientLine(line: string): { email: string; name: string } | null {
  const trimmed = line.trim();
  const m = trimmed.match(/^(.*?)\s*<([^<>]+)>$/);
  const email = (m ? m[2] : trimmed).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  return { email, name: m ? m[1].trim() : "" };
}

export interface CampaignBrief {
  audience: string;
  details: string;
  cta: string;
  contact: string;
  tone: string;
}

export interface NormalizedStep {
  position: number;
  stage: DripStage;
  subject: string;
  bodyMarkdown: string;
  offsetDays: number;
  sendTime: string;
  sendAt: Date;
  approved: boolean;
}

export interface NormalizedCampaign {
  name: string;
  emailType: "event";
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  eventStartsAt: Date;
  goal: string;
  brief: CampaignBrief;
  audience: AudienceInput;
  steps: NormalizedStep[];
}

export type ValidationResult =
  | { ok: true; value: NormalizedCampaign }
  | { ok: false; errors: string[] };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate and normalise a campaign payload from the client. Anything the
 * client says about status, recipients or send times is ignored: send times
 * are always recomputed from the event date, offset, send time and time zone.
 */
export function validateCampaignInput(raw: unknown, now: Date): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(raw)) return { ok: false, errors: ["Request body must be a JSON object."] };

  const name = text(raw.name, 120);
  const eventTitle = text(raw.eventTitle, 200);
  const eventDate = text(raw.eventDate, 10);
  const eventTime = text(raw.eventTime, 5);
  const timezone = text(raw.timezone, 64);

  if (!name) errors.push("Campaign name is required.");
  if (!eventTitle) errors.push("Event title is required.");
  if (!isValidDate(eventDate)) errors.push("Event date must be a valid YYYY-MM-DD date.");
  if (!isValidTime(eventTime)) errors.push("Event time must be a valid HH:MM time.");
  if (!isValidTimeZone(timezone)) errors.push("Time zone must be a valid IANA zone (e.g. America/New_York).");

  const briefRaw = isRecord(raw.brief) ? raw.brief : {};
  const brief: CampaignBrief = {
    audience: text(briefRaw.audience, 300),
    details: text(briefRaw.details, 4000),
    cta: text(briefRaw.cta, 500),
    contact: text(briefRaw.contact, 300),
    tone: text(briefRaw.tone, 40) || "friendly-professional",
  };

  const audienceRaw = isRecord(raw.audience) ? raw.audience : {};
  const recipientLines = Array.isArray(audienceRaw.recipients)
    ? audienceRaw.recipients.filter((r): r is string => typeof r === "string").map((r) => r.trim().slice(0, 320)).filter(Boolean)
    : [];
  const audience: AudienceInput = { recipients: [] };
  if (recipientLines.length === 0) {
    errors.push("Add at least one recipient.");
  } else if (recipientLines.length > MAX_RECIPIENTS) {
    errors.push(`A campaign can have at most ${MAX_RECIPIENTS} recipients.`);
  } else {
    const seen = new Set<string>();
    for (const line of recipientLines) {
      const parsed = parseRecipientLine(line);
      if (!parsed) {
        errors.push(`Invalid recipient: "${line.slice(0, 60)}".`);
        continue;
      }
      if (seen.has(parsed.email)) continue;
      seen.add(parsed.email);
      audience.recipients.push(line);
    }
  }

  let eventStartsAt = new Date(NaN);
  if (isValidDate(eventDate) && isValidTime(eventTime) && isValidTimeZone(timezone)) {
    eventStartsAt = zonedTimeToUtc(eventDate, eventTime, timezone);
    if (eventStartsAt.getTime() <= now.getTime()) errors.push("The event must start in the future.");
  }

  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : null;
  const steps: NormalizedStep[] = [];
  if (!stepsRaw || stepsRaw.length === 0) {
    errors.push("At least one email step is required.");
  } else if (stepsRaw.length > MAX_STEPS) {
    errors.push(`A campaign can have at most ${MAX_STEPS} steps.`);
  } else {
    stepsRaw.forEach((s, i) => {
      const label = `Step ${i + 1}`;
      if (!isRecord(s)) {
        errors.push(`${label} is malformed.`);
        return;
      }
      const stage = text(s.stage, 32) as DripStage;
      const subject = text(s.subject, 200);
      const bodyMarkdown = typeof s.bodyMarkdown === "string" ? s.bodyMarkdown.trim().slice(0, 20000) : "";
      const offsetDays = s.offsetDays;
      const sendTime = text(s.sendTime, 5);

      if (!DRIP_STAGES.includes(stage)) errors.push(`${label}: unknown stage.`);
      if (!subject) errors.push(`${label}: subject is required.`);
      if (!bodyMarkdown) errors.push(`${label}: body is required.`);
      if (typeof offsetDays !== "number" || !Number.isInteger(offsetDays) || offsetDays > 0 || offsetDays < MIN_OFFSET_DAYS) {
        errors.push(`${label}: offset must be a whole number of days between ${MIN_OFFSET_DAYS} and 0 (days before the event).`);
        return;
      }
      if (!isValidTime(sendTime)) {
        errors.push(`${label}: send time must be a valid HH:MM time.`);
        return;
      }
      if (!isValidDate(eventDate) || !isValidTimeZone(timezone)) return;

      steps.push({
        position: i + 1,
        stage,
        subject,
        bodyMarkdown,
        offsetDays,
        sendTime,
        sendAt: computeSendAt(eventDate, offsetDays, sendTime, timezone),
        approved: s.approved === true,
      });
    });

    if (steps.length === stepsRaw.length && !Number.isNaN(eventStartsAt.getTime())) {
      steps.forEach((s, i) => {
        if (s.sendAt.getTime() >= eventStartsAt.getTime()) {
          errors.push(`Step ${i + 1} must be scheduled before the event starts.`);
        }
        if (i > 0 && s.sendAt.getTime() <= steps[i - 1].sendAt.getTime()) {
          errors.push(`Step ${i + 1} must be scheduled after step ${i}.`);
        }
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      emailType: "event",
      eventTitle,
      eventDate,
      eventTime,
      timezone,
      eventStartsAt,
      goal: text(raw.goal, 500),
      brief,
      audience,
      steps,
    },
  };
}

// ── State machine ────────────────────────────────────────────────────────────

export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled";
export type CampaignAction = "launch" | "pause" | "resume" | "cancel";

export const CAMPAIGN_ACTIONS: readonly CampaignAction[] = ["launch", "pause", "resume", "cancel"];

const TRANSITIONS: Record<CampaignAction, { from: CampaignStatus[]; to: CampaignStatus }> = {
  launch: { from: ["draft"], to: "active" },
  pause: { from: ["active"], to: "paused" },
  resume: { from: ["paused"], to: "active" },
  cancel: { from: ["draft", "active", "paused"], to: "cancelled" },
};

export function allowedFromStatuses(action: CampaignAction): CampaignStatus[] {
  return TRANSITIONS[action].from;
}

/** The status an action leads to, or null if the action is not allowed from `current`. */
export function nextCampaignStatus(current: CampaignStatus, action: CampaignAction): CampaignStatus | null {
  const t = TRANSITIONS[action];
  return t && t.from.includes(current) ? t.to : null;
}

export interface LaunchCheckInput {
  status: CampaignStatus;
  eventStartsAt: Date;
  steps: Array<{ approved: boolean; sendAt: Date }>;
  audienceCount: number;
}

/** Reasons a draft cannot be launched yet (empty = ready). */
export function launchBlockers(c: LaunchCheckInput, now: Date): string[] {
  const problems: string[] = [];
  if (c.status !== "draft") problems.push(`Only draft campaigns can be launched (this one is ${c.status}).`);
  if (c.steps.length === 0) problems.push("Add at least one email step.");
  c.steps.forEach((s, i) => {
    if (!s.approved) problems.push(`Step ${i + 1} has not been approved.`);
    if (s.sendAt.getTime() <= now.getTime()) problems.push(`Step ${i + 1} is scheduled in the past.`);
  });
  if (c.eventStartsAt.getTime() <= now.getTime()) problems.push("The event has already started.");
  if (c.audienceCount < 1) problems.push("The selected audience has no eligible recipients.");
  return problems;
}
