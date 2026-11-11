import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createResendProvider } from "@/lib/drip-provider";
import { createSupabaseDripStore } from "@/lib/drip-store";
import { runDripWorker } from "@/lib/drip-worker";
import { missingDripEnv } from "@/lib/drip-service";
import { resolveFromAddress, resolveReplyTo } from "@/lib/email-sender";
import { getBaseURL } from "@/lib/get-url";
import {
  appendUnsubscribeLink,
  buildEmailHtml,
  personaliseBody,
  type EmailType,
} from "@/lib/uddssaMailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Drip worker entry point. Called on a schedule (see docs/DRIP_CAMPAIGNS_SETUP.md)
 * with `Authorization: Bearer $CRON_SECRET`. Processes one bounded batch.
 */
async function handle(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json({ success: false, message: "CRON_SECRET is not configured." }, { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  if (!secretsMatch(header, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const missing = missingDripEnv();
  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, message: `Missing server configuration: ${missing.join(", ")}` },
      { status: 503 }
    );
  }

  try {
    const baseUrl = getBaseURL();
    const summary = await runDripWorker({
      store: createSupabaseDripStore(createAdminClient()),
      provider: createResendProvider(process.env.RESEND_API_KEY!),
      from: (emailType) => resolveFromAddress(undefined, emailType),
      replyTo: resolveReplyTo(),
      render: async ({ subject, bodyMarkdown, recipientName, recipientEmail, emailType }) => {
        const body = personaliseBody(bodyMarkdown, recipientName ?? undefined, recipientEmail);
        return {
          text: appendUnsubscribeLink(body, recipientEmail, baseUrl, emailType as EmailType),
          html: await buildEmailHtml({
            subject,
            body,
            recipientEmail,
            baseUrl,
            emailType: emailType as EmailType,
          }),
        };
      },
    });

    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error("[cron/drip]", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, message: "Worker run failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
