"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Sync if the URL param changes (e.g. navigating with different email)
  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleUnsubscribe = async () => {
    if (!email) {
      setResult({
        success: false,
        message: "Please enter your email address.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unsubscribe failed");
      }

      setResult({
        success: true,
        message:
          "You have been successfully unsubscribed. You will no longer receive marketing emails from UD-DSSA.",
      });
    } catch {
      setResult({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Already unsubscribed ──────────────────────────────────────────────────

  if (result?.success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unsubscribed
          </h1>
          <p className="text-gray-600 mb-6">{result.message}</p>
          <Link
            href="/"
            className="text-blue-primary hover:underline text-sm"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  // ── Confirmation form ─────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unsubscribe from UD-DSSA Emails
          </h1>
          <p className="text-gray-600">
            Are you sure you want to unsubscribe? You will no longer receive
            marketing emails from the UD Data Science Student Association.
          </p>
        </div>

        {/* Error message */}
        {result && !result.success && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
            {result.message}
          </div>
        )}

        {/* Email field — pre-filled from URL param or editable */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary text-gray-800"
            placeholder="your.email@example.com"
            readOnly={!!emailFromUrl}
          />
          {emailFromUrl && (
            <p className="text-xs text-gray-400 mt-1">
              This email was pre-filled from the link you clicked.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={isSubmitting || !email}
            className={`w-full py-2.5 px-4 rounded-md font-medium transition-colors ${
              isSubmitting || !email
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            }`}
          >
            {isSubmitting ? "Unsubscribing..." : "Yes, unsubscribe me"}
          </button>

          <Link
            href="/"
            className="block w-full text-center py-2.5 px-4 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            No, keep me subscribed
          </Link>
        </div>
      </div>
    </div>
  );
}
