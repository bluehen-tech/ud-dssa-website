import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaimedSend, DripStore, FinishOutcome, FreshState } from "./drip-worker";

/** Supabase-backed DripStore. Requires the service-role client (server only). */
export function createSupabaseDripStore(admin: SupabaseClient): DripStore {
  return {
    async claimDue(limit) {
      const { data: sends, error } = await admin.rpc("drip_claim_due", { p_limit: limit });
      if (error) throw new Error(`drip_claim_due failed: ${error.message}`);
      if (!sends || sends.length === 0) return [];

      const ids = (sends as Array<{ id: string }>).map((s) => s.id);
      const { data: rows, error: loadError } = await admin
        .from("drip_sends")
        .select(
          "id, attempts, provider_requested_at, campaign:drip_campaigns(id, email_type, event_starts_at), step:drip_campaign_steps(subject, body_markdown)"
        )
        .in("id", ids);
      if (loadError) throw new Error(`Failed to load claimed sends: ${loadError.message}`);

      return (rows ?? []).map((r: any): ClaimedSend => ({
        sendId: r.id,
        attempts: r.attempts,
        providerRequestedAt: r.provider_requested_at,
        campaignId: r.campaign.id,
        emailType: r.campaign.email_type,
        eventStartsAt: r.campaign.event_starts_at,
        subject: r.step.subject,
        bodyMarkdown: r.step.body_markdown,
      }));
    },

    async freshState(claim): Promise<FreshState> {
      const { data: send, error } = await admin
        .from("drip_sends")
        .select("campaign:drip_campaigns(status), enrollment:drip_enrollments(contact:contacts(email, full_name, status, source_metadata))")
        .eq("id", claim.sendId)
        .single();
      if (error || !send) throw new Error(`Failed to load send state: ${error?.message ?? "not found"}`);

      const row = send as any;
      return {
        campaignStatus: row.campaign?.status ?? "cancelled",
        contact: row.enrollment?.contact ?? null,
      };
    },

    async markRequested(sendId) {
      // Only the first request time matters: it anchors the idempotency window.
      const { error } = await admin
        .from("drip_sends")
        .update({ provider_requested_at: new Date().toISOString() })
        .eq("id", sendId)
        .is("provider_requested_at", null);
      if (error) throw new Error(`Failed to mark send requested: ${error.message}`);
    },

    async noteAttempt(sendId, message) {
      const { error } = await admin
        .from("drip_sends")
        .update({ error: message.slice(0, 500) })
        .eq("id", sendId)
        .eq("status", "sending");
      if (error) throw new Error(`Failed to note attempt: ${error.message}`);
    },

    async finish(sendId, outcome: FinishOutcome) {
      const args = {
        p_send_id: sendId,
        p_status: outcome.status,
        p_provider_message_id: outcome.status === "sent" ? outcome.providerMessageId : null,
        p_error:
          outcome.status === "failed" || outcome.status === "uncertain"
            ? outcome.error
            : outcome.status === "skipped"
              ? outcome.reason
              : null,
        p_enrollment_status: outcome.status === "skipped" ? outcome.enrollmentStatus : null,
      };
      const { error } = await admin.rpc("drip_finish_send", args);
      if (error) throw new Error(`drip_finish_send failed: ${error.message}`);
    },
  };
}
