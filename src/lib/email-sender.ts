import type { EmailType } from "./uddssaMailer";

export const SENDER_ENV_MAP: Record<EmailType, string> = {
  newsletter: "RESEND_FROM_NEWSLETTER",
  event: "RESEND_FROM_EVENT",
  opportunity: "RESEND_FROM_OPPORTUNITY",
  announcement: "RESEND_FROM_ANNOUNCEMENT",
};

export const VALID_EMAIL_TYPES: EmailType[] = ["newsletter", "event", "opportunity", "announcement"];

export function resolveFromAddress(senderKey?: string, emailType?: string): string {
  const key = (senderKey || emailType || "newsletter") as EmailType;
  const envVar = SENDER_ENV_MAP[key];

  if (envVar && process.env[envVar]) {
    return process.env[envVar]!;
  }

  return (
    process.env.RESEND_FROM_NEWSLETTER ||
    process.env.RESEND_FROM ||
    "DSSA <no-reply@bluehen-dssa.org>"
  );
}

export function resolveReplyTo(): string {
  return process.env.RESEND_REPLY_TO || "dssa@udel.edu";
}
