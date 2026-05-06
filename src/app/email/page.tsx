"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import RecipientPicker from "@/components/email/RecipientPicker";
import MarkdownEditor from "@/components/email/MarkdownEditor";
import EmailPreview from "@/components/email/EmailPreview";

// ── Types ────────────────────────────────────────────────────────────────────

type ContentMode = "manual" | "ai_polish" | "ai_draft";
type EmailType = "newsletter" | "event" | "opportunity" | "announcement";
type EditorTab = "edit" | "preview";

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  newsletter: "Newsletter",
  event: "Event",
  opportunity: "Opportunity",
  announcement: "Announcement",
};

const SENDER_LABELS: Record<EmailType, string> = {
  newsletter: "DSSA Newsletter",
  event: "DSSA Events",
  opportunity: "DSSA Opportunities",
  announcement: "DSSA Announcements",
};

interface AiDraftInput {
  type: string;
  audience: string;
  topic: string;
  details: string;
  cta: string;
  contact: string;
  extras: string;
}

const TONE_OPTIONS = [
  "friendly-professional",
  "formal",
  "casual",
  "fun",
] as const;

const MODE_LABELS: Record<ContentMode, { label: string; description: string }> =
  {
    manual: {
      label: "Manual",
      description: "Write the email yourself in Markdown.",
    },
    ai_polish: {
      label: "AI Polish",
      description: "Provide a draft and AI will improve it using Markdown formatting.",
    },
    ai_draft: {
      label: "AI Draft",
      description: "Answer a few questions and let AI generate a full Markdown email.",
    },
  };

// ── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_DRAFT: AiDraftInput = {
  type: "",
  audience: "",
  topic: "",
  details: "",
  cta: "",
  contact: "",
  extras: "",
};

const STAGE_EXTRAS: Record<string, string> = {
  "save-the-date":
    "This is an early save-the-date announcement. Keep it brief and exciting -- just the title, date, and a teaser.",
  "full-details":
    "This is the full event announcement with all details.",
  reminder:
    "This is a reminder email for an upcoming event. Create urgency -- the event is soon!",
  "last-chance":
    "This is a last-chance/day-of email. Strong urgency, FOMO, final call to attend.",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function EmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <EmailPageContent />
    </Suspense>
  );
}

function EmailPageContent() {
  const { session, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillApplied = useRef(false);

  // ── Auth gate ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && (!session || !isAdmin)) {
      router.replace("/");
    }
  }, [isLoading, session, isAdmin, router]);

  // ── Form state ─────────────────────────────────────────────────────────
  const [contentMode, setContentMode] = useState<ContentMode>("ai_draft");
  const [tone, setTone] = useState<string>("friendly-professional");

  // Email type & sender
  const [emailType, setEmailType] = useState<EmailType>("newsletter");
  const [senderOverride, setSenderOverride] = useState<EmailType | "">("");
  const effectiveSender = senderOverride || emailType;

  // manual / ai_polish input
  const [inputSubject, setInputSubject] = useState("");
  const [inputBody, setInputBody] = useState("");

  // ai_draft structured fields
  const [draftInput, setDraftInput] = useState<AiDraftInput>({ ...EMPTY_DRAFT });

  // Output (markdown)
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");

  // Editor tab
  const [editorTab, setEditorTab] = useState<EditorTab>("edit");

  // UX
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<
    Array<{ email: string; success: boolean; detail: string }> | null
  >(null);

  // Recipients
  const [recipientsText, setRecipientsText] = useState(
    "otunmbi@udel.edu\najf@udel.edu"
  );

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setError(null);
    setIsGenerating(true);

    try {
      const payload: Record<string, unknown> = { contentMode, tone };

      if (contentMode === "manual" || contentMode === "ai_polish") {
        payload.subject = inputSubject;
        payload.body = inputBody;
      }
      if (contentMode === "ai_draft") {
        payload.draftInput = draftInput;
      }

      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }

      setGeneratedSubject(data.subject);
      setGeneratedBody(data.body);
      setEditorTab("edit");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [contentMode, tone, inputSubject, inputBody, draftInput]);

  const handleSend = useCallback(async () => {
    setSendStatus(null);
    setSendResults(null);
    setIsSending(true);

    try {
      const recipients = recipientsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const match = line.match(/^(.+?)\s*<(.+@.+)>$/);
          if (match) {
            return { name: match[1].trim(), email: match[2].trim() };
          }
          return { email: line, name: "" };
        });

      if (recipients.length === 0) {
        setSendStatus("No recipients specified.");
        return;
      }

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: generatedSubject,
          body: generatedBody,
          recipients,
          emailType,
          senderKey: senderOverride || undefined,
        }),
      });
      const data = await res.json();
      setSendStatus(data.message);
      if (data.results) {
        setSendResults(data.results);
      }
    } catch {
      setSendStatus("Failed to reach the server.");
    } finally {
      setIsSending(false);
    }
  }, [generatedSubject, generatedBody, recipientsText, emailType, senderOverride]);

  const updateDraftField = (field: keyof AiDraftInput, value: string) => {
    setDraftInput((prev) => ({ ...prev, [field]: value }));
    if (field === "type" && (value === "event" || value === "opportunity" || value === "announcement")) {
      setEmailType(value);
    }
  };

  // ── Pre-populate from query params ─────────────────────────────────────
  useEffect(() => {
    if (prefillApplied.current) return;
    const mode = searchParams.get("mode");
    if (!mode) return;

    prefillApplied.current = true;

    if (mode === "ai_draft" || mode === "ai_polish" || mode === "manual") {
      setContentMode(mode);
    }

    const et = searchParams.get("emailType");
    if (et === "event" || et === "newsletter" || et === "opportunity" || et === "announcement") {
      setEmailType(et);
    }

    const topic = searchParams.get("topic");
    const details = searchParams.get("details");
    const audience = searchParams.get("audience");
    const cta = searchParams.get("cta");
    const stage = searchParams.get("stage");

    const draftType = et || "event";
    setDraftInput({
      type: draftType,
      topic: topic || "",
      details: details || "",
      audience: audience || "",
      cta: cta || "",
      contact: "",
      extras: stage && STAGE_EXTRAS[stage] ? STAGE_EXTRAS[stage] : "",
    });

    if (draftType === "event" || draftType === "opportunity" || draftType === "announcement") {
      setEmailType(draftType as EmailType);
    }
  }, [searchParams]);

  // ── Render guards ──────────────────────────────────────────────────────

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

  // ── Can generate? ──────────────────────────────────────────────────────

  const canGenerate = (() => {
    if (isGenerating) return false;
    if (contentMode === "manual" || contentMode === "ai_polish") {
      return inputSubject.trim().length > 0 && inputBody.trim().length > 0;
    }
    return (
      draftInput.type.trim().length > 0 &&
      draftInput.topic.trim().length > 0 &&
      draftInput.details.trim().length > 0
    );
  })();

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1B365D] to-[#243f6b] flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-[#D4A020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Email Composer
              </h1>
              <p className="text-gray-500 mt-1">
                Draft, polish, or compose Markdown emails for the mailing list.
              </p>
            </div>
          </div>
        </div>

        {/* ── Step 1: Mode + Tone ─────────────────────────────────────────── */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            1. Choose content mode
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(MODE_LABELS) as ContentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setContentMode(mode);
                  setError(null);
                }}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  contentMode === mode
                    ? "border-[#1B365D] bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block font-medium text-gray-900">
                  {MODE_LABELS[mode].label}
                </span>
                <span className="block text-sm text-gray-500 mt-1">
                  {MODE_LABELS[mode].description}
                </span>
              </button>
            ))}
          </div>

          {contentMode !== "manual" && (
            <div>
              <label
                htmlFor="tone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* ── Email type + Sender ─────────────────────────────────────────── */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Email type &amp; sender
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="emailType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email type
              </label>
              <select
                id="emailType"
                value={emailType}
                onChange={(e) => {
                  const val = e.target.value as EmailType;
                  setEmailType(val);
                  setSenderOverride("");
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
              >
                {(Object.keys(EMAIL_TYPE_LABELS) as EmailType[]).map((t) => (
                  <option key={t} value={t}>
                    {EMAIL_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="senderOverride"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Send from
              </label>
              <select
                id="senderOverride"
                value={senderOverride}
                onChange={(e) =>
                  setSenderOverride(e.target.value as EmailType | "")
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
              >
                <option value="">
                  Auto ({SENDER_LABELS[emailType]})
                </option>
                {(Object.keys(SENDER_LABELS) as EmailType[]).map((k) => (
                  <option key={k} value={k}>
                    {SENDER_LABELS[k]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Sending as:{" "}
                <span className="font-medium text-gray-600">
                  {SENDER_LABELS[effectiveSender]}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ── Step 2: Input fields ────────────────────────────────────────── */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            2. Provide content
          </h2>

          {/* manual / ai_polish */}
          {(contentMode === "manual" || contentMode === "ai_polish") && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="inputSubject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject
                </label>
                <input
                  id="inputSubject"
                  type="text"
                  value={inputSubject}
                  onChange={(e) => setInputSubject(e.target.value)}
                  placeholder="Email subject line..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>
              <div>
                <label
                  htmlFor="inputBody"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Body{" "}
                  <span className="font-normal text-gray-400">
                    (Markdown — use {"{name}"} for personalisation)
                  </span>
                </label>
                <textarea
                  id="inputBody"
                  rows={10}
                  value={inputBody}
                  onChange={(e) => setInputBody(e.target.value)}
                  placeholder={`## Hey {name}!\n\nWrite your email body in **Markdown**...\n\n- Bullet points\n- **Bold** and *italic*\n\n---\n\nMore content here.`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D] font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* ai_draft */}
          {contentMode === "ai_draft" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={draftInput.type}
                  onChange={(e) => updateDraftField("type", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                >
                  <option value="">Select...</option>
                  <option value="event">Event</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audience
                </label>
                <input
                  type="text"
                  value={draftInput.audience}
                  onChange={(e) => updateDraftField("audience", e.target.value)}
                  placeholder="e.g. UD students, DSSA members"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic / Title *
                </label>
                <input
                  type="text"
                  value={draftInput.topic}
                  onChange={(e) => updateDraftField("topic", e.target.value)}
                  placeholder="Main topic or title (1 line)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Details *
                </label>
                <textarea
                  rows={3}
                  value={draftInput.details}
                  onChange={(e) => updateDraftField("details", e.target.value)}
                  placeholder="Date, time, location, deadline, etc."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Call-to-Action
                </label>
                <input
                  type="text"
                  value={draftInput.cta}
                  onChange={(e) => updateDraftField("cta", e.target.value)}
                  placeholder="RSVP link / form / reply to this email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={draftInput.contact}
                  onChange={(e) => updateDraftField("contact", e.target.value)}
                  placeholder="Name + email (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extras
                </label>
                <input
                  type="text"
                  value={draftInput.extras}
                  onChange={(e) => updateDraftField("extras", e.target.value)}
                  placeholder="Anything else to include (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>
            </div>
          )}

          {/* Generate button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1B365D] text-white font-medium rounded-lg hover:bg-[#243f6b] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isGenerating && (
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {contentMode === "manual"
                ? "Use as Email"
                : isGenerating
                  ? "Generating..."
                  : "Generate Email"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </section>

        {/* ── Step 3: Tabbed Editor / Preview ─────────────────────────────── */}
        {(generatedSubject || generatedBody) && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab header + subject */}
            <div className="p-6 pb-0 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                3. Review &amp; edit
              </h2>

              {/* Subject input */}
              <div>
                <label
                  htmlFor="outputSubject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject
                </label>
                <input
                  id="outputSubject"
                  type="text"
                  value={generatedSubject}
                  onChange={(e) => setGeneratedSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditorTab("edit")}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    editorTab === "edit"
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    editorTab === "preview"
                      ? "border-[#1B365D] text-[#1B365D]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </span>
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6 pt-4">
              {editorTab === "edit" ? (
                <MarkdownEditor
                  value={generatedBody}
                  onChange={setGeneratedBody}
                />
              ) : (
                <EmailPreview
                  subject={generatedSubject}
                  body={generatedBody}
                  senderLabel={SENDER_LABELS[effectiveSender]}
                />
              )}
            </div>

            {/* Recipients + Send */}
            <div className="p-6 pt-0 space-y-4">
              <div className="border-t border-gray-200 pt-5">
                <RecipientPicker
                  recipientsText={recipientsText}
                  onChange={setRecipientsText}
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    isSending ||
                    !generatedSubject.trim() ||
                    !generatedBody.trim() ||
                    !recipientsText.trim()
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D4A020] text-white font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isSending && (
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  )}
                  {isSending ? "Sending..." : "Send Email"}
                </button>
              </div>

              {sendStatus && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm ${
                    sendStatus.includes("Failed: 0")
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-yellow-50 border border-yellow-200 text-yellow-800"
                  }`}
                >
                  {sendStatus}
                </div>
              )}

              {sendResults && (
                <div className="space-y-1 text-sm">
                  {sendResults.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 ${
                        r.success ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      <span>{r.success ? "✓" : "✗"}</span>
                      <span className="font-mono">{r.email}</span>
                      <span className="text-gray-400">— {r.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="px-4 py-2 text-[#1B365D] hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
