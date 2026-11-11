import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { validateCampaignInput } from "@/lib/drip";
import { listCampaigns, saveCampaign } from "@/lib/drip-service";
import { dripErrorResponse, readJson } from "@/lib/drip-http";

/** GET /api/email/campaigns – list drip campaigns (admin only). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ success: true, campaigns: await listCampaigns(createAdminClient()) });
  } catch (err) {
    return dripErrorResponse(err, "GET /api/email/campaigns");
  }
}

/** POST /api/email/campaigns – create a draft campaign (admin only). */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

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
    const saved = await saveCampaign(createAdminClient(), auth.userId, null, parsed.value);
    return NextResponse.json({ success: true, ...saved }, { status: 201 });
  } catch (err) {
    return dripErrorResponse(err, "POST /api/email/campaigns");
  }
}
