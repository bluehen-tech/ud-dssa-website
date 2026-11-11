"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CampaignStatusBadge from "@/components/email/CampaignStatusBadge";

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  eventTitle: string;
  eventStartsAt: string;
  timezone: string;
  audienceCount: number;
}

export default function CampaignsPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!session || !isAdmin)) router.replace("/");
  }, [isLoading, session, isAdmin, router]);

  useEffect(() => {
    if (isLoading || !session || !isAdmin) return;
    (async () => {
      try {
        const res = await fetch("/api/email/campaigns");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || `Request failed (${res.status})`);
        setCampaigns(data.campaigns);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campaigns");
      }
    })();
  }, [isLoading, session, isAdmin]);

  if (isLoading || !session || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Drip Campaigns</h1>
            <p className="text-gray-500 mt-1">
              Multi-email event sequences. AI drafts the copy; you review, approve and launch.
            </p>
          </div>
          <Link
            href="/email/campaigns/new"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#1B365D] rounded-lg hover:bg-[#243f6b] transition-colors whitespace-nowrap"
          >
            New campaign
          </Link>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {campaigns === null && !error ? (
            <p className="p-6 text-gray-500" role="status">Loading…</p>
          ) : campaigns && campaigns.length === 0 ? (
            <p className="p-6 text-gray-500">No campaigns yet.</p>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">Drip campaigns</caption>
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Campaign</th>
                  <th scope="col" className="px-4 py-3">Event</th>
                  <th scope="col" className="px-4 py-3">Audience</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(campaigns ?? []).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/email/campaigns/${c.id}`} className="font-medium text-[#1B365D] hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.eventTitle}
                      <div className="text-xs text-gray-400">
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: c.timezone }).format(
                          new Date(c.eventStartsAt)
                        )}{" "}
                        ({c.timezone})
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.audienceCount}</td>
                    <td className="px-4 py-3">
                      <CampaignStatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="text-center">
          <Link href="/email" className="px-4 py-2 text-[#1B365D] hover:underline">
            &larr; Back to Email Composer
          </Link>
        </div>
      </div>
    </div>
  );
}
