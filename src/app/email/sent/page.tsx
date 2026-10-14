"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface SentEmail {
  id: string;
  slug: string;
  subject: string;
  email_type: string;
  sender_label: string;
  recipient_count: number;
  sent_at: string;
  published: boolean;
}

const EMAIL_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  newsletter: { bg: "bg-blue-100", text: "text-blue-800" },
  event: { bg: "bg-purple-100", text: "text-purple-800" },
  opportunity: { bg: "bg-green-100", text: "text-green-800" },
  announcement: { bg: "bg-amber-100", text: "text-amber-800" },
};

export default function SentEmailsPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!session || !isAdmin)) {
      router.replace("/");
    }
  }, [isLoading, session, isAdmin, router]);

  const fetchEmails = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/email/sent");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load sent emails");
      }
      setEmails(data.emails);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (session && isAdmin) {
      fetchEmails();
    }
  }, [session, isAdmin, fetchEmails]);

  const getPublicUrl = (slug: string) => {
    return `${window.location.origin}/emails/${slug}`;
  };

  const handleCopy = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(getPublicUrl(slug));
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = getPublicUrl(slug);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch("/api/email/sent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, published: !currentlyPublished }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update");
      }
      setEmails((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, published: !currentlyPublished } : e
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading || !session || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1B365D] to-[#243f6b] flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-[#D4A020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sent Emails</h1>
                <p className="text-gray-500 mt-1">
                  Manage and share links to past emails.
                </p>
              </div>
            </div>
            <Link
              href="/email"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1B365D] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Compose New
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Email list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {fetching ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B365D] mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading sent emails...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">No sent emails yet.</p>
              <Link href="/email" className="text-[#1B365D] hover:underline text-sm mt-2 inline-block">
                Compose your first email
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {emails.map((email) => {
                const typeStyle = EMAIL_TYPE_STYLES[email.email_type] || EMAIL_TYPE_STYLES.newsletter;
                const sentDate = new Date(email.sent_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const sentTime = new Date(email.sent_at).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <div key={email.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                            {email.email_type}
                          </span>
                          <span className="text-xs text-gray-400">
                            {sentDate} at {sentTime}
                          </span>
                          <span className="text-xs text-gray-400">
                            {email.recipient_count} recipient{email.recipient_count !== 1 ? "s" : ""}
                          </span>
                          {!email.published && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              Unpublished
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {email.subject}
                        </h3>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Copy link */}
                        <button
                          type="button"
                          onClick={() => handleCopy(email.slug)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            copiedSlug === email.slug
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          title="Copy shareable link"
                        >
                          {copiedSlug === email.slug ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Copy Link
                            </>
                          )}
                        </button>

                        {/* Open in new tab */}
                        <a
                          href={`/emails/${email.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                          title="Open public page"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </a>

                        {/* Publish toggle */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(email.id, email.published)}
                          disabled={togglingId === email.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            email.published
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          } disabled:opacity-50`}
                          title={email.published ? "Click to unpublish" : "Click to publish"}
                        >
                          {togglingId === email.id ? (
                            <span className="animate-spin inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {email.published ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M15.121 15.121L21 21" />
                              )}
                            </svg>
                          )}
                          {email.published ? "Published" : "Unpublished"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <Link href="/" className="px-4 py-2 text-[#1B365D] hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
