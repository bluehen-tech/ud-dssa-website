import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRecipientLine } from "./drip";

export interface SuppressionSubject {
  status?: string | null;
  source_metadata?: unknown;
}

/**
 * True when the contact must not receive `emailType` mail: globally
 * unsubscribed, or opted out of "all" / that specific list. This is the single
 * suppression rule shared by the one-off sender and the drip worker.
 */
export function isContactSuppressed(contact: SuppressionSubject | null | undefined, emailType: string): boolean {
  if (!contact) return false;
  if (contact.status === "unsubscribed") return true;

  const meta = contact.source_metadata as { unsubscribed_lists?: unknown } | null | undefined;
  const lists = Array.isArray(meta?.unsubscribed_lists) ? (meta!.unsubscribed_lists as unknown[]) : [];
  return lists.includes("all") || lists.includes(emailType);
}

export interface AudienceMember {
  id: string;
  email: string;
}

export interface ResolvedAudience {
  members: AudienceMember[];
  /** Addresses that are not in the contacts table (no consent record, so never enrolled). */
  notFound: string[];
  /** Contacts excluded because they are unsubscribed (globally or from `emailType`). */
  suppressed: number;
}

const LOOKUP_CHUNK = 200;

/**
 * Resolve the admin's recipient lines to enrollable contacts. Only existing,
 * subscribed contacts that are not suppressed for `emailType` qualify. Must run
 * with a trusted (server) client.
 */
export async function resolveAudience(
  admin: SupabaseClient,
  recipientLines: string[],
  emailType: string
): Promise<ResolvedAudience> {
  const wanted = new Set<string>();
  for (const line of recipientLines) {
    const parsed = parseRecipientLine(line);
    if (parsed) wanted.add(parsed.email);
  }
  const emails = Array.from(wanted);

  const found = new Map<string, { id: string; status: string | null; source_metadata: unknown }>();
  for (let i = 0; i < emails.length; i += LOOKUP_CHUNK) {
    const { data, error } = await admin
      .from("contacts")
      .select("id,email,status,source_metadata")
      .in("email", emails.slice(i, i + LOOKUP_CHUNK));
    if (error) throw new Error(`Failed to load contacts: ${error.message}`);
    for (const c of data ?? []) {
      if (c.email) found.set(String(c.email).trim().toLowerCase(), c);
    }
  }

  const result: ResolvedAudience = { members: [], notFound: [], suppressed: 0 };
  for (const email of emails) {
    const c = found.get(email);
    if (!c) result.notFound.push(email);
    else if (c.status !== "subscribed" || isContactSuppressed(c, emailType)) result.suppressed++;
    else result.members.push({ id: c.id, email });
  }
  return result;
}
