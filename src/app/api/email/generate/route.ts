import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  generateEmail,
  type GenerateEmailRequest,
  type ContentMode,
  type SequenceContext,
} from "@/lib/uddssaMailer";
import { DRIP_STAGES, type DripStage } from "@/lib/drip";

// Maximum allowed input length (characters) to prevent abuse.
const MAX_INPUT_LENGTH = 100_000;

const VALID_MODES: ContentMode[] = ["manual", "ai_polish", "ai_draft"];

/** Whitelist and bound the optional drip-sequence context sent by the client. */
function parseSequence(raw: unknown): SequenceContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  if (!DRIP_STAGES.includes(r.stage as DripStage)) return undefined;

  const previousSteps = Array.isArray(r.previousSteps)
    ? r.previousSteps.slice(0, 8).map((p) => {
        const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
        return { stage: str(o.stage, 32), subject: str(o.subject, 200), body: str(o.body, 1500) };
      })
    : [];

  return {
    goal: str(r.goal, 500),
    stage: r.stage as string,
    stageIndex: Number.isInteger(r.stageIndex) ? Math.max(0, r.stageIndex as number) : 0,
    totalSteps: Number.isInteger(r.totalSteps) ? Math.max(1, r.totalSteps as number) : 1,
    previousSteps,
  };
}

/**
 * POST /api/email/generate
 *
 * Accepts a GenerateEmailRequest JSON body, validates it, checks that the
 * caller is an admin, runs the mailer logic, and returns { subject, body }.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth: require an authenticated admin ───────────────────────────────
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("admin_flag, email_access_flag")
      .eq("id", user.id)
      .single();

    if (!profile?.admin_flag && !profile?.email_access_flag) {
      return NextResponse.json(
        { success: false, message: "Forbidden – admin or email access required" },
        { status: 403 }
      );
    }

    // ── Parse & validate body ──────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const contentMode = body.contentMode as ContentMode | undefined;
    if (!contentMode || !VALID_MODES.includes(contentMode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid contentMode. Must be one of: ${VALID_MODES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Simple size guard – stringify the body and check length
    const rawLen = JSON.stringify(body).length;
    if (rawLen > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { success: false, message: "Request body too large" },
        { status: 413 }
      );
    }

    // Build the request object expected by the mailer helper
    const emailReq: GenerateEmailRequest = {
      contentMode,
      tone: typeof body.tone === "string" ? body.tone : undefined,
      subject: typeof body.subject === "string" ? body.subject : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      draftInput:
        body.draftInput && typeof body.draftInput === "object"
          ? ({
              ...(body.draftInput as GenerateEmailRequest["draftInput"]),
              sequence: parseSequence((body.draftInput as Record<string, unknown>).sequence),
            } as GenerateEmailRequest["draftInput"])
          : undefined,
    };

    // ── Generate ───────────────────────────────────────────────────────────
    const result = await generateEmail(emailReq);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[POST /api/email/generate]", message);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
