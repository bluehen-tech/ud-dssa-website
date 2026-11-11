import type { SupabaseClient } from "@supabase/supabase-js";
import {
  allowedFromStatuses,
  launchBlockers,
  type CampaignAction,
  type CampaignStatus,
  type NormalizedCampaign,
} from "./drip";
import { resolveAudience } from "./drip-audience";

/**
 * Database operations for drip campaigns. Every function takes a service-role
 * client and must only be called after the caller has been verified as an
 * admin (see requireAdmin) or is the cron worker.
 */

export class DripServiceError extends Error {
  constructor(message: string, public status: number, public details?: string[]) {
    super(message);
  }
}

/** Env vars the drip pipeline cannot run without (names only; never values). */
export function missingDripEnv(): string[] {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "CRON_SECRET",
    "UNSUBSCRIBE_TOKEN_SECRET",
  ].filter((name) => !process.env[name]?.trim());
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CampaignDto {
  id: string;
  name: string;
  status: CampaignStatus;
  emailType: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  eventStartsAt: string;
  goal: string;
  brief: Record<string, string>;
  audience: { recipients?: string[] };
  launchedAt: string | null;
  steps: Array<{
    position: number;
    stage: string;
    subject: string;
    bodyMarkdown: string;
    offsetDays: number;
    sendTime: string;
    sendAt: string;
    approved: boolean;
  }>;
  audienceCount: number;
  stats?: { enrollments: Record<string, number>; sends: Record<string, number> };
}

function toDto(row: any, steps: any[], audienceCount: number, stats?: CampaignDto["stats"]): CampaignDto {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    emailType: row.email_type,
    eventTitle: row.event_title,
    eventDate: row.event_date,
    eventTime: String(row.event_time).slice(0, 5),
    timezone: row.timezone,
    eventStartsAt: row.event_starts_at,
    goal: row.goal ?? "",
    brief: row.brief ?? {},
    audience: row.audience_filter ?? {},
    launchedAt: row.launched_at,
    steps: steps.map((s) => ({
      position: s.position,
      stage: s.stage,
      subject: s.subject,
      bodyMarkdown: s.body_markdown,
      offsetDays: s.offset_days,
      sendTime: String(s.send_time).slice(0, 5),
      sendAt: s.send_at,
      approved: s.approved_at !== null,
    })),
    audienceCount,
    stats,
  };
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function listCampaigns(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("drip_campaigns")
    .select("id,name,status,event_title,event_starts_at,timezone,created_at,enrollments:drip_enrollments(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new DripServiceError(`Failed to load campaigns: ${error.message}`, 500);

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    eventTitle: c.event_title,
    eventStartsAt: c.event_starts_at,
    timezone: c.timezone,
    audienceCount: c.enrollments?.[0]?.count ?? 0,
  }));
}

export async function getCampaign(admin: SupabaseClient, id: string): Promise<CampaignDto | null> {
  const { data: row, error } = await admin.from("drip_campaigns").select("*").eq("id", id).maybeSingle();
  if (error) throw new DripServiceError(`Failed to load campaign: ${error.message}`, 500);
  if (!row) return null;

  const [steps, enrollCount, stats] = await Promise.all([
    admin.from("drip_campaign_steps").select("*").eq("campaign_id", id).order("position", { ascending: true }),
    admin.from("drip_enrollments").select("id", { count: "exact", head: true }).eq("campaign_id", id),
    admin.rpc("drip_campaign_stats", { p_campaign_id: id }),
  ]);
  if (steps.error) throw new DripServiceError(`Failed to load steps: ${steps.error.message}`, 500);

  return toDto(row, steps.data ?? [], enrollCount.count ?? 0, stats.data ?? undefined);
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Create (campaignId = null) or replace the content of a draft campaign. The
 * audience is resolved server-side now and stored as an enrollment snapshot;
 * nothing the client says about recipients or status is used.
 */
export async function saveCampaign(
  admin: SupabaseClient,
  userId: string,
  campaignId: string | null,
  input: NormalizedCampaign,
  now: Date = new Date()
): Promise<{ id: string; audienceCount: number; notFound: string[]; suppressed: number }> {
  let audience: Awaited<ReturnType<typeof resolveAudience>>;
  try {
    audience = await resolveAudience(admin, input.audience.recipients, input.emailType);
  } catch (err) {
    throw new DripServiceError(err instanceof Error ? err.message : "Failed to look up recipients.", 500);
  }

  const { data, error } = await admin.rpc("drip_save_campaign", {
    p_campaign_id: campaignId,
    p_user_id: userId,
    p_campaign: {
      name: input.name,
      email_type: input.emailType,
      event_title: input.eventTitle,
      event_date: input.eventDate,
      event_time: input.eventTime,
      timezone: input.timezone,
      event_starts_at: input.eventStartsAt.toISOString(),
      goal: input.goal,
      brief: input.brief,
      audience_filter: input.audience,
    },
    p_steps: input.steps.map((s) => ({
      position: s.position,
      stage: s.stage,
      subject: s.subject,
      body_markdown: s.bodyMarkdown,
      offset_days: s.offsetDays,
      send_time: s.sendTime,
      send_at: s.sendAt.toISOString(),
      approved_at: s.approved ? now.toISOString() : null,
      approved_by: s.approved ? userId : null,
    })),
    p_contact_ids: audience.members.map((a) => a.id),
  });

  if (error) {
    if (error.message.includes("campaign_not_draft")) {
      throw new DripServiceError("Only draft campaigns can be edited.", 409);
    }
    throw new DripServiceError(`Failed to save campaign: ${error.message}`, 500);
  }

  return {
    id: data as string,
    audienceCount: audience.members.length,
    notFound: audience.notFound,
    suppressed: audience.suppressed,
  };
}

/**
 * Apply launch / pause / resume / cancel. The allowed source states are
 * enforced by the database in a single conditional UPDATE, so concurrent or
 * repeated requests cannot skip a transition.
 */
export async function transitionCampaign(
  admin: SupabaseClient,
  id: string,
  action: CampaignAction,
  now: Date = new Date()
): Promise<CampaignDto> {
  const current = await getCampaign(admin, id);
  if (!current) throw new DripServiceError("Campaign not found.", 404);

  if (action === "launch") {
    const missing = missingDripEnv();
    if (missing.length > 0) {
      throw new DripServiceError(`Drip sending is not configured on the server (missing: ${missing.join(", ")}).`, 503);
    }
    const blockers = launchBlockers(
      {
        status: current.status,
        eventStartsAt: new Date(current.eventStartsAt),
        steps: current.steps.map((s) => ({ approved: s.approved, sendAt: new Date(s.sendAt) })),
        audienceCount: current.audienceCount,
      },
      now
    );
    if (blockers.length > 0) {
      throw new DripServiceError("This campaign cannot be launched yet.", current.status === "draft" ? 422 : 409, blockers);
    }

    // The function re-checks everything under a row lock.
    const { error } = await admin.rpc("drip_launch_campaign", { p_campaign_id: id });
    if (error) {
      if (error.message.includes("invalid_state")) throw new DripServiceError("Campaign is no longer a draft.", 409);
      if (error.message.includes("launch_not_ready")) throw new DripServiceError("This campaign cannot be launched yet.", 422);
      throw new DripServiceError(`Failed to launch campaign: ${error.message}`, 500);
    }
  } else {
    const to = { pause: "paused", resume: "active", cancel: "cancelled" }[action];
    const stamp = { pause: "paused_at", resume: null, cancel: "cancelled_at" }[action];
    const { data, error } = await admin
      .from("drip_campaigns")
      .update({ status: to, updated_at: now.toISOString(), ...(stamp ? { [stamp]: now.toISOString() } : {}) })
      .eq("id", id)
      .in("status", allowedFromStatuses(action))
      .select("id");
    if (error) throw new DripServiceError(`Failed to ${action} campaign: ${error.message}`, 500);
    if (!data || data.length === 0) {
      throw new DripServiceError(`Cannot ${action} a campaign that is ${current.status}.`, 409);
    }
  }

  return (await getCampaign(admin, id))!;
}
