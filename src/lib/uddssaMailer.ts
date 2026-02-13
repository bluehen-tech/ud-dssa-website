/**
 * uddssaMailer.ts
 *
 * TypeScript re-implementation of the CLI logic in uddssa_mailer.py.
 * Supports three content modes:
 *   - manual:    Use supplied subject/body as-is (trim + ensure {name} greeting).
 *   - ai_polish: Send existing subject/body to an AI provider for improvement.
 *   - ai_draft:  Collect structured fields and let AI draft the email from scratch.
 *
 * The AI providers supported are OpenAI and DeepSeek, selected via env var AI_PROVIDER.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ContentMode = "manual" | "ai_polish" | "ai_draft";
export type AiProvider = "openai" | "deepseek";

/** Structured intake fields used in ai_draft mode (mirrors the CLI prompts). */
export interface AiDraftInput {
  type: string;       // event / opportunity / announcement
  audience: string;   // e.g. "UD students", "DSSA members"
  topic: string;      // Main topic / title (1 line)
  details: string;    // Date/time/location/deadline
  cta: string;        // Call-to-action (RSVP link, form, etc.)
  contact?: string;   // Contact person + email (optional)
  extras?: string;    // Anything else to include (optional)
}

export interface GenerateEmailRequest {
  contentMode: ContentMode;
  tone?: string; // default: "friendly-professional"

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
  return `You are helping draft an email for a university data science student association (UD-DSSA).
Tone: ${tone}.
Requirements:
- Output MUST be valid JSON with exactly these keys: "subject", "body".
- "subject": short, clear, not spammy (avoid ALL CAPS, too many !!!).
- "body": plain text email body, friendly and professional. Emojis are allowed but keep it tasteful (0–3).
- Keep body under ~220 words unless user asks otherwise.
- Include a call-to-action and relevant details.
- The body MUST start with exactly: "Hi {name},"
- Avoid exaggerated marketing claims.
Return ONLY JSON. No markdown. No commentary.`;
}

function buildDraftUserMessage(input: AiDraftInput): string {
  return `Write an email for UD-DSSA.

TYPE: ${input.type}
AUDIENCE: ${input.audience}
TOPIC: ${input.topic}
DETAILS: ${input.details}
CTA: ${input.cta}
CONTACT: ${input.contact ?? ""}
NOTES: ${input.extras ?? ""}

Return ONLY JSON with keys "subject" and "body".
The body MUST start with: "Hi {name},"
Keep it clear, non-spammy, and under ~200 words.
Use at most 2 emojis total.`;
}

function buildPolishUserMessage(
  draftSubject: string,
  draftBody: string
): string {
  return `Improve the following email while preserving meaning and facts.
Make it clearer, better structured, and aligned with the tone.

DRAFT SUBJECT:
${draftSubject}

DRAFT BODY:
${draftBody}

Return ONLY JSON with keys "subject" and "body".`;
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
    url = "https://api.openai.com/v1/responses";
    headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    payload = {
      model: model || "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      store: false,
    };
  } else {
    // deepseek
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
    const errText = await res.text().catch(() => "(no body)");
    throw new Error(
      `${provider} API error (${res.status}): ${errText.slice(0, 500)}`
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
  // Strip potential markdown fences the model might add despite instructions
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

/** Ensure the body starts with a "Hi {name}," greeting (mirrors Python behaviour). */
function ensureNameGreeting(body: string): string {
  if (!body.includes("{name}")) {
    return `Hi {name},\n\n${body}`;
  }
  return body;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate (or pass-through) an email subject + body based on the requested
 * content mode. This is the main entry point that the API route calls.
 */
export async function generateEmail(
  req: GenerateEmailRequest
): Promise<GenerateEmailResult> {
  const tone = req.tone?.trim() || "friendly-professional";

  // ── Manual mode ──────────────────────────────────────────────────────────
  if (req.contentMode === "manual") {
    const subject = (req.subject ?? "").trim();
    const body = ensureNameGreeting((req.body ?? "").trim());

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

  const { subject, body: rawBody } = parseAiJson(rawOutput);
  const body = ensureNameGreeting(rawBody);

  return { subject, body };
}

/**
 * Personalise the email body by replacing {name} with the recipient's name.
 * Falls back to "there" when the name is empty (mirrors Python behaviour).
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

/**
 * Append a standard unsubscribe footer to the email body.
 *
 * The link points to /unsubscribe?email=<encoded email> on the site,
 * which shows a confirmation page before processing the request.
 *
 * @param body           The email body (already personalised).
 * @param recipientEmail The recipient's email address.
 * @param baseUrl        The site base URL (no trailing slash). Falls back to
 *                       NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_VERCEL_URL / localhost.
 */
export function appendUnsubscribeLink(
  body: string,
  recipientEmail: string,
  baseUrl?: string
): string {
  const siteUrl =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.replace(/\/+$/, "") ||
    "http://localhost:3001";

  // Ensure https for non-localhost URLs
  const normalizedUrl = siteUrl.startsWith("http")
    ? siteUrl
    : `https://${siteUrl}`;

  const unsubscribeUrl = `${normalizedUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

  return `${body}\n\n---\nIf you no longer wish to receive these emails, you can unsubscribe here:\n${unsubscribeUrl}`;
}
