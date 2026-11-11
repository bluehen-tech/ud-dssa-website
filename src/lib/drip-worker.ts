import { isContactSuppressed } from "./drip-audience";
import type { ProviderRequest, ProviderResult } from "./drip-provider";

/**
 * Drip dispatch loop. Claiming and state transitions are atomic SQL functions
 * (see docs/sql/drip_campaigns.sql); this module decides what to do with each
 * claimed send and is written against a small store interface so the decisions
 * can be tested without a database or a real email provider.
 */

export const MAX_SEND_ATTEMPTS = 3;

export interface ClaimedSend {
  sendId: string;
  /** 1 on the first claim, +1 each time a stale claim is picked up again. */
  attempts: number;
  /** Set once a request to the provider may have been made for this send. */
  providerRequestedAt: string | null;
  campaignId: string;
  emailType: string;
  eventStartsAt: string;
  subject: string;
  bodyMarkdown: string;
}

export interface FreshState {
  campaignStatus: string;
  contact: {
    email: string;
    full_name: string | null;
    status: string | null;
    source_metadata: unknown;
  } | null;
}

export type FinishOutcome =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "failed"; error: string }
  | { status: "uncertain"; error: string }
  /** Not sent; `enrollmentStatus` stops the recipient's sequence. */
  | { status: "skipped"; reason: string; enrollmentStatus: "unsubscribed" | "stopped" }
  /** Caller asserts nothing was delivered; frees the slot to be claimed again. */
  | { status: "released" };

export interface DripStore {
  claimDue(limit: number): Promise<ClaimedSend[]>;
  /** Re-read campaign status and contact preferences right before sending. */
  freshState(claim: ClaimedSend): Promise<FreshState>;
  /** Record (once) that a provider request is about to be made. */
  markRequested(sendId: string): Promise<void>;
  /** Persist an error on a send that stays claimed for a later retry. */
  noteAttempt(sendId: string, error: string): Promise<void>;
  finish(sendId: string, outcome: FinishOutcome): Promise<void>;
}

export interface RenderedEmail {
  text: string;
  html: string;
}

export interface WorkerDeps {
  store: DripStore;
  provider: (req: ProviderRequest) => Promise<ProviderResult>;
  render: (args: {
    subject: string;
    bodyMarkdown: string;
    recipientName: string | null;
    recipientEmail: string;
    emailType: string;
  }) => Promise<RenderedEmail>;
  from: (emailType: string) => string;
  replyTo: string;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
}

export interface WorkerOptions {
  batchSize?: number;
  /** Stop starting new sends after this many ms (the serverless time budget). */
  deadlineMs?: number;
  /** Pause between provider calls (Resend allows ~2 requests/second). */
  spacingMs?: number;
}

export interface WorkerSummary {
  claimed: number;
  sent: number;
  skipped: number;
  failed: number;
  uncertain: number;
  retryLater: number;
  released: number;
  aborted: string | null;
  errors: string[];
}

type Disposition = keyof Pick<WorkerSummary, "sent" | "skipped" | "failed" | "uncertain" | "retryLater" | "released">;

export async function runDripWorker(deps: WorkerDeps, opts: WorkerOptions = {}): Promise<WorkerSummary> {
  const { store, provider } = deps;
  const now = deps.now ?? (() => new Date());
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const batchSize = opts.batchSize ?? 40;
  const deadlineMs = opts.deadlineMs ?? 50_000;
  const spacingMs = opts.spacingMs ?? 550;
  const startedAt = now().getTime();

  const summary: WorkerSummary = {
    claimed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    uncertain: 0,
    retryLater: 0,
    released: 0,
    aborted: null,
    errors: [],
  };

  const claims = await store.claimDue(batchSize);
  summary.claimed = claims.length;

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];

    // Out of time or provider blocked us: hand back claims we have not started.
    // A claim that already reached the provider once is left for the retry path
    // instead, because releasing it would let a new attempt (and a new
    // idempotency key) deliver a duplicate.
    if (summary.aborted || now().getTime() - startedAt > deadlineMs) {
      if (!summary.aborted) summary.aborted = "time budget exhausted";
      if (claim.providerRequestedAt) {
        summary.retryLater++;
      } else {
        await store.finish(claim.sendId, { status: "released" });
        summary.released++;
      }
      continue;
    }

    try {
      const result = await processClaim(claim);
      summary[result.disposition]++;
      if (result.abort) summary.aborted = result.abort;
      if (result.reachedProvider && i < claims.length - 1) await sleep(spacingMs);
    } catch (err) {
      // Unexpected failure (DB, rendering, ...). Leave the claim in place; it is
      // re-claimed after the lease and gives up after MAX_SEND_ATTEMPTS.
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push(`send ${claim.sendId}: ${message}`);
      summary.retryLater++;
      await store.noteAttempt(claim.sendId, message).catch(() => undefined);
    }
  }

  return summary;

  async function processClaim(
    claim: ClaimedSend
  ): Promise<{ disposition: Disposition; reachedProvider: boolean; abort?: string }> {
    const isRetry = claim.providerRequestedAt !== null;

    // Everything below is evaluated immediately before sending, so an
    // unsubscribe or pause that landed after the claim still wins.
    const fresh = await store.freshState(claim);

    if (fresh.campaignStatus !== "active") {
      if (isRetry) return { disposition: "retryLater", reachedProvider: false };
      await store.finish(claim.sendId, { status: "released" });
      return { disposition: "released", reachedProvider: false };
    }

    if (now().getTime() >= new Date(claim.eventStartsAt).getTime()) {
      await store.finish(claim.sendId, {
        status: "skipped",
        reason: isRetry ? "event_started_before_retry" : "event_started",
        enrollmentStatus: "stopped",
      });
      return { disposition: "skipped", reachedProvider: false };
    }

    const contact = fresh.contact;
    if (!contact) {
      await store.finish(claim.sendId, { status: "skipped", reason: "contact_missing", enrollmentStatus: "stopped" });
      return { disposition: "skipped", reachedProvider: false };
    }

    if (isContactSuppressed(contact, claim.emailType)) {
      await store.finish(claim.sendId, {
        status: "skipped",
        reason: isRetry ? "unsubscribed_before_retry" : "unsubscribed",
        enrollmentStatus: "unsubscribed",
      });
      return { disposition: "skipped", reachedProvider: false };
    }

    const rendered = await deps.render({
      subject: claim.subject,
      bodyMarkdown: claim.bodyMarkdown,
      recipientName: contact.full_name,
      recipientEmail: contact.email,
      emailType: claim.emailType,
    });

    await store.markRequested(claim.sendId);
    const result = await provider({
      idempotencyKey: `drip-${claim.sendId}`,
      from: deps.from(claim.emailType),
      replyTo: deps.replyTo,
      to: contact.email,
      subject: claim.subject,
      text: rendered.text,
      html: rendered.html,
    });

    switch (result.kind) {
      case "ok":
        await store.finish(claim.sendId, { status: "sent", providerMessageId: result.messageId });
        return { disposition: "sent", reachedProvider: true };

      case "rejected":
        await store.finish(claim.sendId, { status: "failed", error: result.detail });
        return { disposition: "failed", reachedProvider: true };

      case "blocked":
        // Nothing was delivered, but every further send would fail the same way.
        if (!isRetry) {
          await store.finish(claim.sendId, { status: "released" });
          return { disposition: "released", reachedProvider: true, abort: result.detail };
        }
        await store.noteAttempt(claim.sendId, result.detail);
        return { disposition: "retryLater", reachedProvider: true, abort: result.detail };

      case "transient":
        // The provider may have accepted it. Never guess: retry with the same
        // idempotency key, and after MAX_SEND_ATTEMPTS record it as uncertain.
        if (claim.attempts >= MAX_SEND_ATTEMPTS) {
          await store.finish(claim.sendId, { status: "uncertain", error: result.detail });
          return { disposition: "uncertain", reachedProvider: true };
        }
        await store.noteAttempt(claim.sendId, result.detail);
        return { disposition: "retryLater", reachedProvider: true };
    }
  }
}
