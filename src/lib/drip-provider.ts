/**
 * Resend delivery for drip sends. Every request carries an Idempotency-Key
 * derived from the send attempt id, so if we lose the response (timeout,
 * crash) a retry within Resend's idempotency window returns the original
 * result instead of delivering a second copy.
 */

export interface ProviderRequest {
  idempotencyKey: string;
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type ProviderResult =
  /** Accepted by the provider. */
  | { kind: "ok"; messageId: string | null }
  /** Definitively refused for this message (bad address, invalid payload): never delivered. */
  | { kind: "rejected"; detail: string }
  /** Outcome unknown (timeout, 5xx, network): the message may or may not have been accepted. */
  | { kind: "transient"; detail: string }
  /** Definitively not delivered, and every other send will fail too (bad API key, rate limit): stop the run. */
  | { kind: "blocked"; detail: string };

export function classifyResendResponse(status: number, bodyText: string): ProviderResult {
  if (status >= 200 && status < 300) {
    let messageId: string | null = null;
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed.id === "string") messageId = parsed.id;
    } catch {
      // Accepted but unparseable body; keep going without an id.
    }
    return { kind: "ok", messageId };
  }

  const detail = `HTTP ${status}: ${bodyText.slice(0, 200)}`;
  if (status === 401 || status === 403 || status === 429) return { kind: "blocked", detail };
  // 409 = a request with this idempotency key is still in flight; 408 = timeout.
  if (status === 408 || status === 409 || status >= 500) return { kind: "transient", detail };
  return { kind: "rejected", detail };
}

export function createResendProvider(apiKey: string, fetchImpl: typeof fetch = fetch) {
  return async function send(req: ProviderRequest): Promise<ProviderResult> {
    try {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": req.idempotencyKey,
        },
        body: JSON.stringify({
          from: req.from,
          reply_to: req.replyTo,
          to: [req.to],
          subject: req.subject,
          text: req.text,
          html: req.html,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      return classifyResendResponse(res.status, await res.text());
    } catch (err) {
      return { kind: "transient", detail: err instanceof Error ? err.message : "Network error" };
    }
  };
}
