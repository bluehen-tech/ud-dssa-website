import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { personaliseBody, appendUnsubscribeLink } from "@/lib/uddssaMailer";
import { getBaseURL } from "@/lib/get-url";

// ── Sender address resolution ─────────────────────────────────────────────

type EmailType = "newsletter" | "event" | "opportunity" | "announcement";

const SENDER_ENV_MAP: Record<EmailType, string> = {
  newsletter: "RESEND_FROM_NEWSLETTER",
  event: "RESEND_FROM_EVENT",
  opportunity: "RESEND_FROM_OPPORTUNITY",
  announcement: "RESEND_FROM_ANNOUNCEMENT",
};

const VALID_EMAIL_TYPES: EmailType[] = ["newsletter", "event", "opportunity", "announcement"];

function resolveFromAddress(senderKey?: string, emailType?: string): string {
  const key = (senderKey || emailType || "newsletter") as EmailType;
  const envVar = SENDER_ENV_MAP[key];

  if (envVar && process.env[envVar]) {
    return process.env[envVar]!;
  }

  // Fallback chain: type-specific -> newsletter -> RESEND_FROM -> hardcoded default
  return (
    process.env.RESEND_FROM_NEWSLETTER ||
    process.env.RESEND_FROM ||
    "DSSA <no-reply@bluehen-dssa.org>"
  );
}

/**
 * POST /api/email/send
 *
 * Sends the finalised email to a list of recipients via the Resend API.
 *
 * Expected body:
 * {
 *   subject: string;
 *   body: string;            // may contain {name} placeholder
 *   recipients: Array<{ email: string; name?: string }>;
 *   emailType?: "newsletter" | "event" | "opportunity" | "announcement";
 *   senderKey?: "newsletter" | "event" | "opportunity" | "announcement";
 * }
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
      .select("admin_flag")
      .eq("id", user.id)
      .single();

    if (!profile?.admin_flag) {
      return NextResponse.json(
        { success: false, message: "Forbidden – admin access required" },
        { status: 403 }
      );
    }

    // ── Parse & validate body ──────────────────────────────────────────────
    let payload: {
      subject?: string;
      body?: string;
      recipients?: Array<{ email: string; name?: string }>;
      emailType?: string;
      senderKey?: string;
    };

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { subject, body: bodyTemplate, recipients, emailType, senderKey } = payload;

    // Validate emailType / senderKey if provided
    if (senderKey && !VALID_EMAIL_TYPES.includes(senderKey as EmailType)) {
      return NextResponse.json(
        { success: false, message: `Invalid senderKey. Must be one of: ${VALID_EMAIL_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (emailType && !VALID_EMAIL_TYPES.includes(emailType as EmailType)) {
      return NextResponse.json(
        { success: false, message: `Invalid emailType. Must be one of: ${VALID_EMAIL_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!subject?.trim()) {
      return NextResponse.json(
        { success: false, message: "Subject is required" },
        { status: 400 }
      );
    }

    if (!bodyTemplate?.trim()) {
      return NextResponse.json(
        { success: false, message: "Body is required" },
        { status: 400 }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one recipient is required" },
        { status: 400 }
      );
    }

    // Validate all emails are non-empty strings
    for (const r of recipients) {
      if (!r.email || typeof r.email !== "string" || !r.email.includes("@")) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid email address: "${r.email}"`,
          },
          { status: 400 }
        );
      }
    }

    // ── Resend config ──────────────────────────────────────────────────────
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { success: false, message: "RESEND_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const fromAddr = resolveFromAddress(senderKey, emailType);

    // ── Send to each recipient ─────────────────────────────────────────────
    const results: Array<{
      email: string;
      success: boolean;
      detail: string;
    }> = [];

    const baseUrl = getBaseURL();

    for (const recipient of recipients) {
      const personalisedBody = personaliseBody(bodyTemplate, recipient.name);
      const finalBody = appendUnsubscribeLink(
        personalisedBody,
        recipient.email,
        baseUrl
      );

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddr,
            to: [recipient.email],
            subject: subject.trim(),
            text: finalBody,
          }),
        });

        const resText = await res.text();

        if (res.ok) {
          results.push({
            email: recipient.email,
            success: true,
            detail: "Sent",
          });
        } else {
          results.push({
            email: recipient.email,
            success: false,
            detail: resText.slice(0, 200),
          });
        }
      } catch (err: unknown) {
        results.push({
          email: recipient.email,
          success: false,
          detail:
            err instanceof Error ? err.message : "Network error",
        });
      }

      // Small delay between sends to avoid rate limiting (matches Python script)
      if (recipients.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failed === 0,
      message: `Sent: ${sent}, Failed: ${failed}`,
      sent,
      failed,
      results,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[POST /api/email/send]", message);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
