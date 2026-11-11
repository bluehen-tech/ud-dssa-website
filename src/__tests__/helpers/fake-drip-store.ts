import type { ClaimedSend, DripStore, FinishOutcome, FreshState } from "@/lib/drip-worker";

/**
 * In-memory model of the SQL in docs/sql/drip_campaigns.sql, used to exercise
 * the worker's decisions without a database. claimDue/finish mirror
 * drip_claim_due / drip_finish_send (including the UNIQUE (enrollment, step)
 * guard and the stale-claim retry/give-up rules). It does NOT prove the SQL
 * itself is correct; that needs a real Postgres.
 */

export interface FakeContact {
  email: string;
  full_name: string | null;
  status: "subscribed" | "unsubscribed";
  source_metadata: { unsubscribed_lists?: string[] } | null;
}

interface Step { id: string; position: number; sendAt: Date; subject: string; body: string }
interface Enrollment { id: string; contactId: string; status: string; nextPosition: number }
interface Send {
  id: string; stepId: string; enrollmentId: string; status: string; attempts: number;
  claimedAt: Date; providerRequestedAt: Date | null; messageId: string | null; error: string | null;
}

const LEASE_MS = 10 * 60_000;
const MAX_ATTEMPTS = 3;
const KEY_AGE_MS = 20 * 3_600_000;

export class FakeDripStore implements DripStore {
  now = new Date("2026-11-01T12:00:00Z");
  campaign = { id: "camp-1", status: "active", emailType: "event", eventStartsAt: new Date("2026-11-20T18:00:00Z") };
  steps: Step[] = [];
  enrollments: Enrollment[] = [];
  contacts = new Map<string, FakeContact>();
  sends: Send[] = [];
  private seq = 0;

  addStep(position: number, sendAt: string, subject = `Step ${position}`) {
    this.steps.push({ id: `step-${position}`, position, sendAt: new Date(sendAt), subject, body: `Body ${position} {name}` });
  }

  addRecipient(id: string, contact: Partial<FakeContact> = {}) {
    this.contacts.set(id, {
      email: `${id}@udel.edu`,
      full_name: id,
      status: "subscribed",
      source_metadata: null,
      ...contact,
    });
    this.enrollments.push({ id: `enr-${id}`, contactId: id, status: "active", nextPosition: 1 });
  }

  advance(ms: number) {
    this.now = new Date(this.now.getTime() + ms);
  }

  enrollment(contactId: string) {
    return this.enrollments.find((e) => e.contactId === contactId)!;
  }

  sendsFor(contactId: string) {
    const enr = this.enrollment(contactId);
    return this.sends.filter((s) => s.enrollmentId === enr.id);
  }

  private hydrate(s: Send): ClaimedSend {
    const step = this.steps.find((x) => x.id === s.stepId)!;
    return {
      sendId: s.id,
      attempts: s.attempts,
      providerRequestedAt: s.providerRequestedAt ? s.providerRequestedAt.toISOString() : null,
      campaignId: this.campaign.id,
      emailType: this.campaign.emailType,
      eventStartsAt: this.campaign.eventStartsAt.toISOString(),
      subject: step.subject,
      bodyMarkdown: step.body,
    };
  }

  async claimDue(limit: number): Promise<ClaimedSend[]> {
    const t = this.now.getTime();
    const claimed: Send[] = [];

    // 1. give up on exhausted stale claims
    for (const s of this.sends) {
      if (s.status !== "sending" || t - s.claimedAt.getTime() < LEASE_MS) continue;
      const keyExpired = s.providerRequestedAt && t - s.providerRequestedAt.getTime() > KEY_AGE_MS;
      if (s.attempts >= MAX_ATTEMPTS || keyExpired) {
        s.status = s.providerRequestedAt ? "uncertain" : "failed";
        const enr = this.enrollments.find((e) => e.id === s.enrollmentId)!;
        enr.status = s.status === "failed" ? "failed" : "held";
      }
    }

    // 2. re-claim stale sends of active campaigns
    if (this.campaign.status === "active") {
      for (const s of this.sends) {
        if (claimed.length >= limit) break;
        if (s.status === "sending" && t - s.claimedAt.getTime() >= LEASE_MS) {
          s.claimedAt = this.now;
          s.attempts += 1;
          claimed.push(s);
        }
      }
    }

    // 3. new claims; the (enrollment, step) uniqueness check is the dedupe guard
    if (this.campaign.status === "active") {
      for (const e of this.enrollments) {
        if (claimed.length >= limit) break;
        if (e.status !== "active") continue;
        const step = this.steps.find((x) => x.position === e.nextPosition);
        if (!step || step.sendAt.getTime() > t) continue;
        if (this.sends.some((s) => s.enrollmentId === e.id && s.stepId === step.id)) continue;
        const send: Send = {
          id: `send-${++this.seq}`, stepId: step.id, enrollmentId: e.id, status: "sending", attempts: 1,
          claimedAt: this.now, providerRequestedAt: null, messageId: null, error: null,
        };
        this.sends.push(send);
        claimed.push(send);
      }
    }

    this.completeFinishedCampaign();
    return claimed.map((s) => this.hydrate(s));
  }

  async freshState(claim: ClaimedSend): Promise<FreshState> {
    const send = this.sends.find((s) => s.id === claim.sendId)!;
    const enr = this.enrollments.find((e) => e.id === send.enrollmentId)!;
    return { campaignStatus: this.campaign.status, contact: this.contacts.get(enr.contactId) ?? null };
  }

  async markRequested(sendId: string) {
    const s = this.sends.find((x) => x.id === sendId)!;
    if (!s.providerRequestedAt) s.providerRequestedAt = this.now;
  }

  async noteAttempt(sendId: string, error: string) {
    const s = this.sends.find((x) => x.id === sendId)!;
    if (s.status === "sending") s.error = error;
  }

  async finish(sendId: string, outcome: FinishOutcome) {
    const idx = this.sends.findIndex((x) => x.id === sendId && x.status === "sending");
    if (idx < 0) return; // idempotent, like the SQL function
    const s = this.sends[idx];
    if (outcome.status === "released") {
      this.sends.splice(idx, 1);
      return;
    }
    const enr = this.enrollments.find((e) => e.id === s.enrollmentId)!;
    s.status = outcome.status;
    if (outcome.status === "sent") s.messageId = outcome.providerMessageId;
    if (outcome.status === "failed" || outcome.status === "uncertain") s.error = outcome.error;
    if (outcome.status === "skipped") s.error = outcome.reason;

    if (enr.status === "active") {
      if (outcome.status === "sent") {
        enr.nextPosition += 1;
        if (enr.nextPosition > Math.max(...this.steps.map((x) => x.position))) enr.status = "completed";
      } else if (outcome.status === "skipped") {
        enr.status = outcome.enrollmentStatus;
      } else {
        enr.status = outcome.status === "failed" ? "failed" : "held";
      }
    }
    this.completeFinishedCampaign();
  }

  private completeFinishedCampaign() {
    if (this.campaign.status === "active" && !this.enrollments.some((e) => e.status === "active")) {
      this.campaign.status = "completed";
    }
  }
}
