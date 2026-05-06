/**
 * uddssaMailer.ts
 *
 * TypeScript re-implementation of the CLI logic in uddssa_mailer.py.
 * Supports three content modes:
 *   - manual:    Use supplied subject/body as-is (markdown).
 *   - ai_polish: Send existing subject/body to an AI provider for improvement.
 *   - ai_draft:  Collect structured fields and let AI draft the email from scratch.
 *
 * The AI generates MARKDOWN which is converted to inline-styled HTML for email.
 */

import { readFile } from "fs/promises";
import { join } from "path";
import { marked } from "marked";

// ── Types ────────────────────────────────────────────────────────────────────

export type ContentMode = "manual" | "ai_polish" | "ai_draft";
export type AiProvider = "openai" | "deepseek";
export type EmailType = "newsletter" | "event" | "opportunity" | "announcement";

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  newsletter: "DSSA Newsletter",
  event: "DSSA Events",
  opportunity: "DSSA Opportunities",
  announcement: "DSSA Announcements",
};

const EMAIL_TEMPLATE_PATH = join(process.cwd(), "src", "emails", "udssa-recruitment-email.html");

const LOGO_URL = "https://ud-dssa-website.vercel.app/images/heroWatermark.jpg";

/** Structured intake fields used in ai_draft mode (mirrors the CLI prompts). */
export interface AiDraftInput {
  type: string;
  audience: string;
  topic: string;
  details: string;
  cta: string;
  contact?: string;
  extras?: string;
}

export interface GenerateEmailRequest {
  contentMode: ContentMode;
  tone?: string;

  // For manual & ai_polish modes
  subject?: string;
  body?: string;

  // For ai_draft mode
  draftInput?: AiDraftInput;
}

export interface GenerateEmailResult {
  subject: string;
  body: string;
}

// ── Markdown configuration ───────────────────────────────────────────────────

marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Convert markdown to email-safe HTML with inline styles.
 * Email clients don't support <style> blocks, so we inline everything.
 */
export function markdownToEmailHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown) as string;

  return rawHtml
    .replace(/<h1(.*?)>/g, '<h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#1B365D;line-height:1.3;">')
    .replace(/<h2(.*?)>/g, '<h2 style="margin:24px 0 12px;font-size:22px;font-weight:600;color:#1B365D;line-height:1.3;">')
    .replace(/<h3(.*?)>/g, '<h3 style="margin:20px 0 8px;font-size:18px;font-weight:600;color:#1B365D;line-height:1.3;">')
    .replace(/<p(.*?)>/g, '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333333;">')
    .replace(/<ul(.*?)>/g, '<ul style="margin:0 0 16px;padding-left:24px;color:#333333;">')
    .replace(/<ol(.*?)>/g, '<ol style="margin:0 0 16px;padding-left:24px;color:#333333;">')
    .replace(/<li(.*?)>/g, '<li style="margin:0 0 8px;font-size:16px;line-height:1.5;">')
    .replace(/<a /g, '<a style="color:#1B365D;font-weight:500;text-decoration:underline;" ')
    .replace(/<hr\s*\/?>/g, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />')
    .replace(/<blockquote(.*?)>/g, '<blockquote style="margin:16px 0;padding:12px 20px;border-left:4px solid #D4A020;background:#f8f9fa;font-style:italic;color:#555555;">')
    .replace(/<img /g, '<img style="max-width:100%;height:auto;border-radius:8px;display:block;margin:16px auto;" ')
    .replace(/<strong(.*?)>/g, '<strong style="font-weight:600;color:#1a1a1a;">')
    .replace(/<em(.*?)>/g, '<em style="font-style:italic;">');
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function resolveProvider(): { provider: AiProvider; apiKey: string } {
  const raw = (process.env.AI_PROVIDER ?? "openai").trim().toLowerCase();
  const provider: AiProvider = raw === "deepseek" ? "deepseek" : "openai";

  const apiKey =
    provider === "deepseek"
      ? process.env.DEEPSEEK_API_KEY ?? ""
      : process.env.OPENAI_API_KEY ?? "";

  if (!apiKey) {
    throw new Error(
      `Missing API key for AI provider "${provider}". ` +
        `Set ${provider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY"} in your environment.`
    );
  }

  return { provider, apiKey };
}

function buildSystemPrompt(tone: string): string {
  return `You are helping draft an email for a university data science student association (UD-DSSA at the University of Delaware).
Tone: ${tone}.
Requirements:
- Output MUST be valid JSON with exactly these keys: "subject", "body".
- "subject": short, clear, not spammy (avoid ALL CAPS, too many !!!).
- "body": the email body written in **Markdown** format. Use headings (##, ###), bold, italic, bullet lists, horizontal rules (---), and emojis as appropriate.
- Keep body under ~300 words unless user asks otherwise.
- Include a call-to-action and relevant details.
- The body SHOULD start with a personalized greeting like "## Hey {name}!" or "Hi {name}," using the {name} placeholder.
- Use markdown formatting creatively: headings for sections, bold for emphasis, lists for key points, --- for visual breaks.
- Images can be referenced with ![alt](url) syntax if provided.
- Avoid exaggerated marketing claims.
Return ONLY valid JSON. No markdown fences. No commentary outside the JSON.`;
}

function buildDraftUserMessage(input: AiDraftInput): string {
  return `Write an email for UD-DSSA in Markdown format.

TYPE: ${input.type}
AUDIENCE: ${input.audience}
TOPIC: ${input.topic}
DETAILS: ${input.details}
CTA: ${input.cta}
CONTACT: ${input.contact ?? ""}
NOTES: ${input.extras ?? ""}

Return ONLY JSON with keys "subject" and "body".
The body MUST be written in Markdown format with appropriate headings, bold, lists, and emojis.
Start with a greeting using {name} placeholder.
Keep it clear, engaging, and under ~250 words.`;
}

function buildPolishUserMessage(
  draftSubject: string,
  draftBody: string
): string {
  return `Improve the following email while preserving meaning and facts.
Make it clearer, better structured, and aligned with the tone.
The body should use Markdown formatting (headings, bold, lists, horizontal rules, emojis where appropriate).

DRAFT SUBJECT:
${draftSubject}

DRAFT BODY:
${draftBody}

Return ONLY JSON with keys "subject" and "body". The body must be valid Markdown.`;
}

/** Call OpenAI or DeepSeek and return the raw text content from the response. */
async function callAiProvider(
  provider: AiProvider,
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  model?: string
): Promise<string> {
  let url: string;
  let headers: Record<string, string>;
  let payload: Record<string, unknown>;

  if (provider === "openai") {
    const resolvedModel = (
      model ||
      process.env.OPENAI_MODEL ||
      "gpt-4.1-mini"
    ).trim();
    
    url = "https://api.openai.com/v1/responses";
    headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const openAiOrg = process.env.OPENAI_ORGANIZATION?.trim();
    const openAiProject = process.env.OPENAI_PROJECT?.trim();
    if (openAiOrg) headers["OpenAI-Organization"] = openAiOrg;
    if (openAiProject) headers["OpenAI-Project"] = openAiProject;

    payload = {
      model: resolvedModel,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      store: false,
    };

    if (process.env.LOG_AI_CONFIG === "true") {
      const keySuffix = apiKey.slice(-6);
      console.log("[AI] provider=openai model=%s key=...%s org=%s project=%s", resolvedModel, keySuffix, openAiOrg ? "set" : "unset", openAiProject ? "set" : "unset");
    }
  } else {
    url = "https://api.deepseek.com/chat/completions";
    headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    payload = {
      model: model || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const requestId =
      res.headers.get("x-request-id") ??
      res.headers.get("openai-request-id") ??
      undefined;
    const errText = await res.text().catch(() => "(no body)");
    throw new Error(
      `${provider} API error (${res.status})${requestId ? ` [request_id: ${requestId}]` : ""}: ${errText.slice(0, 500)}`
    );
  }

  const data = await res.json();

  let raw = "";
  if (provider === "openai") {
    const parts: string[] = [];
    for (const out of data.output ?? []) {
      for (const c of out.content ?? []) {
        if (typeof c === "object" && c !== null && "text" in c) {
          parts.push(String(c.text));
        }
      }
    }
    raw = parts.join("\n").trim();
  } else {
    try {
      raw = (data.choices?.[0]?.message?.content ?? "").trim();
    } catch {
      raw = "";
    }
  }

  if (!raw) {
    throw new Error(
      `${provider} returned no text output. Raw response: ${JSON.stringify(data).slice(0, 1000)}`
    );
  }

  return raw;
}

function parseAiJson(raw: string): { subject: string; body: string } {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/, "");
  }

  const obj = JSON.parse(cleaned);
  const subject = String(obj.subject ?? "").trim();
  const body = String(obj.body ?? "").trim();

  if (!subject || !body) {
    throw new Error("AI returned empty subject or body.");
  }

  return { subject, body };
}

const URL_REGEX = /https?:\/\/[\S]+/gi;

function buildUnsubscribeUrl(baseUrl: string | undefined, recipientEmail: string, list: EmailType | "all") {
  const siteUrl =
    baseUrl?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000";

  const normalizedUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
  const encodedEmail = encodeURIComponent(recipientEmail);
  const encodedList = encodeURIComponent(list);

  return `${normalizedUrl}/unsubscribe?email=${encodedEmail}&list=${encodedList}`;
}

function renderTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, "g"), value),
    template
  );
}

async function loadEmailTemplate(): Promise<string> {
  return await readFile(EMAIL_TEMPLATE_PATH, "utf-8");
}

export async function buildEmailHtml({
  subject,
  body,
  recipientEmail,
  baseUrl,
  emailType,
}: {
  subject: string;
  body: string;
  recipientEmail: string;
  baseUrl?: string;
  emailType?: EmailType;
}): Promise<string> {
  const template = await loadEmailTemplate();
  const type = emailType || "newsletter";
  const senderLabel = EMAIL_TYPE_LABELS[type];
  const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, recipientEmail, type);
  const bodyHtml = markdownToEmailHtml(body);

  return renderTemplate(template, {
    senderLabel,
    senderDescription: "Data Science Student Association @ University of Delaware",
    subject,
    bodyHtml,
    unsubscribeUrl,
    logoUrl: LOGO_URL,
  });
}

/**
 * Append a standard unsubscribe footer to the plain-text email body.
 */
export function appendUnsubscribeLink(
  body: string,
  recipientEmail: string,
  baseUrl?: string,
  list: EmailType | "all" = "all"
): string {
  const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, recipientEmail, list);
  const listLabel = list === "all" ? "all emails" : EMAIL_TYPE_LABELS[list];

  return `${body}\n\n---\nIf you no longer wish to receive these emails, you can unsubscribe from ${listLabel} here:\n${unsubscribeUrl}`;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate (or pass-through) an email subject + body based on the requested
 * content mode. Returns markdown in the body field.
 */
export async function generateEmail(
  req: GenerateEmailRequest
): Promise<GenerateEmailResult> {
  const tone = req.tone?.trim() || "friendly-professional";

  // ── Manual mode ──────────────────────────────────────────────────────────
  if (req.contentMode === "manual") {
    const subject = (req.subject ?? "").trim();
    const body = (req.body ?? "").trim();

    if (!subject || !body) {
      throw new Error("Manual mode requires both a subject and body.");
    }

    return { subject, body };
  }

  // ── AI modes (ai_polish / ai_draft) ──────────────────────────────────────
  const { provider, apiKey } = resolveProvider();
  const systemPrompt = buildSystemPrompt(tone);

  let userMessage: string;

  if (req.contentMode === "ai_draft") {
    if (!req.draftInput) {
      throw new Error("ai_draft mode requires draftInput fields.");
    }
    userMessage = buildDraftUserMessage(req.draftInput);
  } else if (req.contentMode === "ai_polish") {
    if (!req.subject || !req.body) {
      throw new Error("ai_polish mode requires a draft subject and body.");
    }
    userMessage = buildPolishUserMessage(req.subject, req.body);
  } else {
    throw new Error(`Unknown content mode: ${req.contentMode}`);
  }

  const rawOutput = await callAiProvider(
    provider,
    apiKey,
    systemPrompt,
    userMessage
  );

  const { subject, body } = parseAiJson(rawOutput);

  return { subject, body };
}

/**
 * Personalise the email body by replacing {name} with the recipient's name.
 * Falls back to "there" when the name is empty.
 */
export function personaliseBody(
  bodyTemplate: string,
  recipientName?: string
): string {
  return bodyTemplate.replace(
    /\{name\}/g,
    recipientName?.trim() || "there"
  );
}
