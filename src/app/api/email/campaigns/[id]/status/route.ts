import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { CAMPAIGN_ACTIONS, type CampaignAction } from "@/lib/drip";
import { transitionCampaign } from "@/lib/drip-service";
import { dripErrorResponse, readJson, UUID_RE } from "@/lib/drip-http";

/**
 * POST /api/email/campaigns/[id]/status  { action: "launch" | "pause" | "resume" | "cancel" }
 *
 * The client names an action, never a target status; the server decides
 * whether the transition is legal from the campaign's current state.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid campaign id" }, { status: 400 });
  }

  const raw = (await readJson(request)) as { action?: unknown } | undefined;
  const action = raw?.action;
  if (typeof action !== "string" || !CAMPAIGN_ACTIONS.includes(action as CampaignAction)) {
    return NextResponse.json(
      { success: false, message: `action must be one of: ${CAMPAIGN_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const campaign = await transitionCampaign(createAdminClient(), params.id, action as CampaignAction);
    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    return dripErrorResponse(err, "POST /api/email/campaigns/[id]/status");
  }
}
