"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-xl ring-1 ring-slate-200">
          <p className="text-slate-500">Loading…</p>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const rawList = searchParams.get("list") || "all";
  const listLabel = {
    newsletter: "Newsletter",
    event: "Events",
    opportunity: "Opportunities",
    announcement: "Announcements",
  }[rawList as "newsletter" | "event" | "opportunity" | "announcement"] ||
    (rawList === "all" ? "all emails" : rawList);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setError("No email address provided. Please use the unsubscribe link from the email.");
      return;
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    setError(null);
    setStatus(null);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list: rawList }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Unable to unsubscribe. Please try again later.");
      } else {
        setStatus(data.message || "You have been unsubscribed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-xl ring-1 ring-slate-200">
        <h1 className="text-3xl font-semibold text-slate-900">Unsubscribe from UD-DSSA</h1>
        <p className="mt-4 text-slate-600">
          You are about to unsubscribe <strong>{email}</strong> from <strong>{listLabel}</strong>.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-500">
            Clicking the button below will immediately unsubscribe you from these messages.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            If you did not request this, please ignore this page.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        ) : null}

        {status ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            {status}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={isProcessing || !email}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing
              ? "Processing…"
              : `Unsubscribe from future ${listLabel} emails from DSSA`}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Return to UD-DSSA
          </a>
        </div>
      </div>
    </div>
  );
}
