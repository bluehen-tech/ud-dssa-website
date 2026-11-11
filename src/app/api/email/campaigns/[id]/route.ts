import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateCampaignInput } from "@/lib/drip";
import { getCampaign, saveCampaign } from "@/lib/drip-service";
import { dripErrorResponse, readJson, UUID_RE } from "@/lib/drip-http";

interface RouteContext {
  params: { id: string };
}

/** GET /api/email/campaigns/[id] – campaign with steps and delivery counts (admin only). */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid campaign id" }, { status: 400 });
  }

  try {
    const campaign = await getCampaign(createAdminClient(), params.id);
    if (!campaign) return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });
    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    return dripErrorResponse(err, "GET /api/email/campaigns/[id]");
  }
}

/** PUT /api/email/campaigns/[id] – replace the content of a draft campaign (admin only). */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ success: false, message: "Invalid campaign id" }, { status: 400 });
  }

  const raw = await readJson(request);
  if (raw === undefined) {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = validateCampaignInput(raw, new Date());
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, message: "Invalid campaign.", details: parsed.errors },
      { status: 400 }
    );
  }

  try {
    const saved = await saveCampaign(createAdminClient(), auth.userId, params.id, parsed.value);
    return NextResponse.json({ success: true, ...saved });
  } catch (err) {
    return dripErrorResponse(err, "PUT /api/email/campaigns/[id]");
  }
}
