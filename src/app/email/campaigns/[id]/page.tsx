"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import MarkdownEditor from "@/components/email/MarkdownEditor";
import EmailPreview from "@/components/email/EmailPreview";
import RecipientPicker from "@/components/email/RecipientPicker";
import CampaignStatusBadge from "@/components/email/CampaignStatusBadge";
import {
  DEFAULT_STAGE_TIMING,
  DRIP_STAGES,
  MAX_STEPS,
  STAGE_LABELS,
  STAGE_PROMPTS,
  computeSendAt,
  isValidDate,
  isValidTime,
  isValidTimeZone,
  zonedTimeToUtc,
  type DripStage,
} from "@/lib/drip";

// ── Types ────────────────────────────────────────────────────────────────────

interface StepState {
  stage: DripStage;
  subject: string;
  bodyMarkdown: string;
  daysBefore: number;
  sendTime: string;
  approved: boolean;
  tab: "edit" | "preview";
  generating: boolean;
  error: string | null;
}

interface Stats {
  enrollments: Record<string, number>;
  sends: Record<string, number>;
}

const TONES = ["friendly-professional", "formal", "casual", "fun"];
const SAVED_MESSAGE_KEY = "drip-campaign-saved-message";
const FIELD =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D] disabled:bg-gray-50 disabled:text-gray-500";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

function newStep(stage: DripStage): StepState {
  const timing = DEFAULT_STAGE_TIMING[stage];
  return {
    stage,
    subject: "",
    bodyMarkdown: "",
    daysBefore: -timing.offsetDays,
    sendTime: timing.sendTime,
    approved: false,
    tab: "edit",
    generating: false,
    error: null,
  };
}

function toLines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

function formatInZone(date: Date, timeZone: string): string {
  // dateStyle/timeStyle cannot be combined with timeZoneName, so use explicit fields.
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignEditorPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const campaignId = params.id === "new" ? null : params.id;

  useEffect(() => {
    if (!isLoading && (!session || !isAdmin)) router.replace("/");
  }, [isLoading, session, isAdmin, router]);

  // Campaign fields
  const [name, setName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("18:00");
  const [timezone, setTimezone] = useState("America/New_York");
  const [goal, setGoal] = useState("");
  const [briefAudience, setBriefAudience] = useState("");
  const [details, setDetails] = useState("");
  const [cta, setCta] = useState("");
  const [contact, setContact] = useState("");
  const [tone, setTone] = useState("friendly-professional");
  const [recipientsText, setRecipientsText] = useState("");
  const [steps, setSteps] = useState<StepState[]>(() => DRIP_STAGES.map(newStep));

  // Server state
  const [status, setStatus] = useState<string>("draft");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(campaignId !== null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  // UX
  const [busy, setBusy] = useState<string | null>(null);
  // `at: "controls"` shows the result beside the Save/Launch buttons (where the
  // admin is looking) instead of at the top of a long page.
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
    details?: string[];
    at?: "controls";
  } | null>(null);
  const [confirmingLaunch, setConfirmingLaunch] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const readOnly = status !== "draft";

  useEffect(() => {
    setTimezone(browserTimeZone());
  }, []);

  // ── Payload ────────────────────────────────────────────────────────────
  const payload = useMemo(
    () => ({
      name,
      eventTitle,
      eventDate,
      eventTime,
      timezone,
      goal,
      brief: { audience: briefAudience, details, cta, contact, tone },
      audience: { recipients: toLines(recipientsText) },
      steps: steps.map((s) => ({
        stage: s.stage,
        subject: s.subject,
        bodyMarkdown: s.bodyMarkdown,
        offsetDays: -Math.abs(Math.trunc(Number(s.daysBefore) || 0)),
        sendTime: s.sendTime,
        approved: s.approved,
      })),
    }),
    [name, eventTitle, eventDate, eventTime, timezone, goal, briefAudience, details, cta, contact, tone, recipientsText, steps]
  );
  const snapshot = JSON.stringify(payload);
  const dirty = savedSnapshot === null || snapshot !== savedSnapshot;

  // ── Load ───────────────────────────────────────────────────────────────
  const applyCampaign = useCallback((c: any) => {
    setName(c.name);
    setEventTitle(c.eventTitle);
    setEventDate(c.eventDate);
    setEventTime(c.eventTime);
    setTimezone(c.timezone);
    setGoal(c.goal ?? "");
    setBriefAudience(c.brief?.audience ?? "");
    setDetails(c.brief?.details ?? "");
    setCta(c.brief?.cta ?? "");
    setContact(c.brief?.contact ?? "");
    setTone(c.brief?.tone ?? "friendly-professional");
    setRecipientsText((c.audience?.recipients ?? []).join("\n"));
    const loaded: StepState[] = c.steps.map((s: any) => ({
      stage: s.stage,
      subject: s.subject,
      bodyMarkdown: s.bodyMarkdown,
      daysBefore: -s.offsetDays,
      sendTime: s.sendTime,
      approved: s.approved,
      tab: "edit",
      generating: false,
      error: null,
    }));
    setSteps(loaded);
    setStatus(c.status);
    setAudienceCount(c.audienceCount);
    setStats(c.stats ?? null);
    setSavedSnapshot(
      JSON.stringify({
        name: c.name,
        eventTitle: c.eventTitle,
        eventDate: c.eventDate,
        eventTime: c.eventTime,
        timezone: c.timezone,
        goal: c.goal ?? "",
        brief: {
          audience: c.brief?.audience ?? "",
          details: c.brief?.details ?? "",
          cta: c.brief?.cta ?? "",
          contact: c.brief?.contact ?? "",
          tone: c.brief?.tone ?? "friendly-professional",
        },
        audience: { recipients: c.audience?.recipients ?? [] },
        steps: loaded.map((s) => ({
          stage: s.stage,
          subject: s.subject,
          bodyMarkdown: s.bodyMarkdown,
          offsetDays: -s.daysBefore,
          sendTime: s.sendTime,
          approved: s.approved,
        })),
      })
    );
  }, []);

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const res = await fetch(`/api/email/campaigns/${campaignId}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || `Request failed (${res.status})`);
    applyCampaign(data.campaign);
  }, [campaignId, applyCampaign]);

  useEffect(() => {
    if (!campaignId || isLoading || !session || !isAdmin) return;
    reload()
      .catch((err) => setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to load campaign" }))
      .finally(() => setLoading(false));
  }, [campaignId, isLoading, session, isAdmin, reload]);

  // ── Derived schedule ───────────────────────────────────────────────────
  const scheduleReady = isValidDate(eventDate) && isValidTime(eventTime) && isValidTimeZone(timezone);
  const eventStart = scheduleReady ? zonedTimeToUtc(eventDate, eventTime, timezone) : null;
  const sendAts = steps.map((s) => {
    if (!scheduleReady || !isValidTime(s.sendTime)) return null;
    return computeSendAt(eventDate, -Math.abs(Math.trunc(Number(s.daysBefore) || 0)), s.sendTime, timezone);
  });
  const firstSend = sendAts.reduce<Date | null>((min, d) => (d && (!min || d < min) ? d : min), null);

  // ── Step helpers ───────────────────────────────────────────────────────
  const updateStep = (i: number, patch: Partial<StepState>, content = false) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch, ...(content ? { approved: false } : {}) } : s)));

  const generateStep = async (i: number) => {
    const step = steps[i];
    updateStep(i, { generating: true, error: null });
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentMode: "ai_draft",
          tone,
          draftInput: {
            type: "event",
            audience: briefAudience,
            topic: eventTitle,
            details: `${details}${eventStart ? `\nEvent starts: ${formatInZone(eventStart, timezone)}` : ""}`,
            cta,
            contact,
            extras: STAGE_PROMPTS[step.stage],
            sequence: {
              goal,
              stage: step.stage,
              stageIndex: i,
              totalSteps: steps.length,
              previousSteps: steps.slice(0, i).map((p) => ({ stage: p.stage, subject: p.subject, body: p.bodyMarkdown })),
            },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `Request failed (${res.status})`);
      updateStep(i, { subject: data.subject, bodyMarkdown: data.body, approved: false, tab: "edit", generating: false });
    } catch (err) {
      updateStep(i, { generating: false, error: err instanceof Error ? err.message : "Generation failed" });
    }
  };

  const addStep = () => {
    const unused = DRIP_STAGES.find((st) => !steps.some((s) => s.stage === st)) ?? "reminder";
    setSteps((prev) => [...prev, newStep(unused)]);
  };

  // ── Server actions ─────────────────────────────────────────────────────
  const save = async (): Promise<boolean> => {
    setBusy("save");
    setMessage(null);
    try {
      const res = await fetch(campaignId ? `/api/email/campaigns/${campaignId}` : "/api/email/campaigns", {
        method: campaignId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMessage({
          kind: "error",
          text: data.message || `Save failed (HTTP ${res.status}).`,
          details: data.details,
          at: "controls",
        });
        return false;
      }
      const skipped: string[] = [];
      if (data.notFound?.length) skipped.push(`${data.notFound.length} not in Contacts (${data.notFound.slice(0, 3).join(", ")}${data.notFound.length > 3 ? ", …" : ""})`);
      if (data.suppressed) skipped.push(`${data.suppressed} unsubscribed`);
      const savedText = `Draft saved. ${data.audienceCount} recipient${data.audienceCount === 1 ? "" : "s"} enrolled${skipped.length ? `; skipped: ${skipped.join("; ")}` : ""}.`;

      if (!campaignId) {
        // The page remounts on the new URL; carry the result across.
        try {
          sessionStorage.setItem(SAVED_MESSAGE_KEY, savedText);
        } catch {
          // Storage unavailable; the enrolled count is still shown on the page.
        }
        router.replace(`/email/campaigns/${data.id}`);
      } else {
        await reload();
        setMessage({ kind: "ok", text: savedText, at: "controls" });
      }
      return true;
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to save", at: "controls" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    setBusy("refresh");
    setMessage(null);
    try {
      await reload();
      setMessage({ kind: "ok", text: `Refreshed at ${new Date().toLocaleTimeString()}.`, at: "controls" });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Failed to refresh", at: "controls" });
    } finally {
      setBusy(null);
    }
  };

  const act = async (action: "launch" | "pause" | "resume" | "cancel") => {
    if (!campaignId) return;
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/email/campaigns/${campaignId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMessage({ kind: "error", text: data.message || `Request failed (HTTP ${res.status}).`, details: data.details, at: "controls" });
        return;
      }
      await reload();
      setConfirmingLaunch(false);
      setMessage({
        kind: "ok",
        text: { launch: "Campaign launched.", pause: "Campaign paused. No further emails will be sent until you resume.", resume: "Campaign resumed.", cancel: "Campaign cancelled." }[action],
        at: "controls",
      });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Request failed", at: "controls" });
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (confirmingLaunch) cancelRef.current?.focus();
  }, [confirmingLaunch]);

  // Show the "Draft saved" result carried over from the create-then-redirect.
  useEffect(() => {
    if (loading || !campaignId) return;
    try {
      const saved = sessionStorage.getItem(SAVED_MESSAGE_KEY);
      if (saved) {
        sessionStorage.removeItem(SAVED_MESSAGE_KEY);
        setMessage({ kind: "ok", text: saved, at: "controls" });
      }
    } catch {
      // Storage unavailable; nothing to show.
    }
  }, [loading, campaignId]);

  const renderMessage = () =>
    message && (
      <div
        role={message.kind === "error" ? "alert" : "status"}
        className={`px-4 py-3 rounded-lg text-sm border ${
          message.kind === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-800"
        }`}
      >
        {message.text}
        {message.details && (
          <ul className="list-disc ml-5 mt-1">
            {message.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    );

  // ── Render ─────────────────────────────────────────────────────────────
  if (isLoading || !session || !isAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary" role="status" aria-label="Loading" />
      </div>
    );
  }

  const allApproved = steps.length > 0 && steps.every((s) => s.approved && s.subject.trim() && s.bodyMarkdown.trim());
  const canLaunch = status === "draft" && campaignId !== null && !dirty && allApproved && (audienceCount ?? 0) > 0;
  const launchHint = !campaignId
    ? "Save the draft first."
    : dirty
      ? "Save your changes before launching."
      : !allApproved
        ? "Approve every step to enable launch."
        : (audienceCount ?? 0) < 1
          ? "The audience has no eligible recipients."
          : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaignId ? name || "Campaign" : "New drip campaign"}</h1>
            <p className="text-gray-500 mt-1">
              AI drafts only. Nothing is sent until you approve every email and launch.
            </p>
          </div>
          {campaignId && <CampaignStatusBadge status={status} />}
        </div>

        <div aria-live="polite">{message && !message.at && renderMessage()}</div>

        {readOnly && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-sm">
            This campaign is {status}, so its content is locked and there is no Save button.
            {(status === "active" || status === "paused") && " You can pause, resume or cancel it below."} To change its
            emails, recipients or dates, cancel it and{" "}
            <Link href="/email/campaigns/new" className="font-medium underline">
              create a new campaign
            </Link>
            .
          </div>
        )}

        <fieldset disabled={readOnly} className="space-y-6 min-w-0">
          {/* Event brief */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">1. Event brief</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={LABEL}>Campaign name *</label>
                <input id="name" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
              </div>
              <div>
                <label htmlFor="eventTitle" className={LABEL}>Event title *</label>
                <input id="eventTitle" className={FIELD} value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} maxLength={200} />
              </div>
              <div>
                <label htmlFor="eventDate" className={LABEL}>Event date *</label>
                <input id="eventDate" type="date" className={FIELD} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="eventTime" className={LABEL}>Start time *</label>
                <input id="eventTime" type="time" className={FIELD} value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="timezone" className={LABEL}>Time zone *</label>
                <input
                  id="timezone"
                  list="timezones"
                  className={FIELD}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  aria-describedby="timezone-help"
                />
                <datalist id="timezones">
                  {((Intl as any).supportedValuesOf?.("timeZone") ?? ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"]).map(
                    (tz: string) => (
                      <option key={tz} value={tz} />
                    )
                  )}
                </datalist>
                <p id="timezone-help" className="text-xs text-gray-500 mt-1">
                  {!isValidTimeZone(timezone)
                    ? "Enter a valid IANA time zone, e.g. America/New_York."
                    : eventStart
                      ? `Event starts ${formatInZone(eventStart, timezone)}. All send times below use this zone.`
                      : "Send times below use this zone."}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="details" className={LABEL}>Event facts (the only facts the AI may use) *</label>
                <textarea
                  id="details"
                  rows={4}
                  className={FIELD}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Location, speakers, agenda, food, registration deadline… Anything not listed here will be left out of the drafts."
                />
              </div>
              <div>
                <label htmlFor="cta" className={LABEL}>Call-to-action</label>
                <input id="cta" className={FIELD} value={cta} onChange={(e) => setCta(e.target.value)} placeholder="RSVP link / reply to this email" />
              </div>
              <div>
                <label htmlFor="contact" className={LABEL}>Contact person</label>
                <input id="contact" className={FIELD} value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div>
                <label htmlFor="briefAudience" className={LABEL}>Audience description (for the AI)</label>
                <input id="briefAudience" className={FIELD} value={briefAudience} onChange={(e) => setBriefAudience(e.target.value)} placeholder="e.g. UD grad students" />
              </div>
              <div>
                <label htmlFor="tone" className={LABEL}>Tone</label>
                <select id="tone" className={FIELD} value={tone} onChange={(e) => setTone(e.target.value)}>
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="goal" className={LABEL}>Sequence goal</label>
                <input id="goal" className={FIELD} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. 60 RSVPs before the event" maxLength={500} />
              </div>
            </div>
          </section>

          {/* Audience */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">2. Audience</h2>
            <p className="text-sm text-gray-600">
              You choose the recipients; the AI never does. Only addresses that are <strong>subscribed contacts</strong> are enrolled.
              Unknown addresses and anyone unsubscribed (globally or from Events) are skipped when you save, and unsubscribes are
              re-checked immediately before every send.
            </p>
            <RecipientPicker heading="Recipients" recipientsText={recipientsText} onChange={setRecipientsText} />
            {audienceCount !== null && campaignId && (
              <p className="text-sm text-gray-600">
                Enrolled in this draft: <strong>{audienceCount}</strong>
              </p>
            )}
          </section>

          {/* Steps */}
          <section className="space-y-4" aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-lg font-semibold text-gray-800 px-1">3. Emails</h2>
            {steps.map((step, i) => {
              const sendAt = sendAts[i];
              const pastEvent = sendAt && eventStart && sendAt >= eventStart;
              const ids = `step-${i}`;
              return (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">
                      Email {i + 1}: {STAGE_LABELS[step.stage]}
                    </h3>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-sm text-red-600 hover:underline"
                        aria-label={`Remove email ${i + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor={`${ids}-stage`} className={LABEL}>Stage</label>
                      <select
                        id={`${ids}-stage`}
                        className={FIELD}
                        value={step.stage}
                        onChange={(e) => updateStep(i, { stage: e.target.value as DripStage }, true)}
                      >
                        {DRIP_STAGES.map((st) => (
                          <option key={st} value={st}>{STAGE_LABELS[st]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`${ids}-days`} className={LABEL}>Days before event</label>
                      <input
                        id={`${ids}-days`}
                        type="number"
                        min={0}
                        max={365}
                        step={1}
                        className={FIELD}
                        value={step.daysBefore}
                        onChange={(e) => updateStep(i, { daysBefore: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
                      />
                    </div>
                    <div>
                      <label htmlFor={`${ids}-time`} className={LABEL}>Send time (local)</label>
                      <input
                        id={`${ids}-time`}
                        type="time"
                        className={FIELD}
                        value={step.sendTime}
                        onChange={(e) => updateStep(i, { sendTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className={`text-sm ${pastEvent ? "text-red-600" : "text-gray-600"}`}>
                    {sendAt
                      ? pastEvent
                        ? "This is scheduled at or after the event start; move it earlier."
                        : `Scheduled: ${formatInZone(sendAt, timezone)}`
                      : "Enter a valid event date, time and time zone to see the schedule."}
                  </p>

                  <div>
                    <button
                      type="button"
                      onClick={() => generateStep(i)}
                      disabled={step.generating || !eventTitle.trim() || !details.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#243f6b] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {step.generating ? "Generating…" : step.subject ? "Regenerate with AI" : "Draft with AI"}
                    </button>
                    {(!eventTitle.trim() || !details.trim()) && (
                      <span className="ml-3 text-xs text-gray-500">Add an event title and facts first.</span>
                    )}
                    {step.error && (
                      <p role="alert" className="mt-2 text-sm text-red-600">{step.error}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`${ids}-subject`} className={LABEL}>Subject</label>
                    <input
                      id={`${ids}-subject`}
                      className={FIELD}
                      value={step.subject}
                      onChange={(e) => updateStep(i, { subject: e.target.value }, true)}
                      maxLength={200}
                    />
                  </div>

                  <div role="tablist" aria-label={`Email ${i + 1} view`} className="flex border-b border-gray-200">
                    {(["edit", "preview"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={step.tab === tab}
                        onClick={() => updateStep(i, { tab })}
                        className={`px-5 py-2 text-sm font-medium border-b-2 capitalize ${
                          step.tab === tab ? "border-[#1B365D] text-[#1B365D]" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div role="tabpanel">
                    {step.tab === "edit" ? (
                      <MarkdownEditor value={step.bodyMarkdown} onChange={(v) => updateStep(i, { bodyMarkdown: v }, true)} />
                    ) : (
                      <EmailPreview subject={step.subject} body={step.bodyMarkdown} senderLabel="DSSA Events" />
                    )}
                  </div>

                  <label className="flex items-start gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-[#1B365D] focus:ring-[#1B365D]"
                      checked={step.approved}
                      disabled={!step.subject.trim() || !step.bodyMarkdown.trim()}
                      onChange={(e) => updateStep(i, { approved: e.target.checked })}
                    />
                    <span>I have read this email and approve it for sending. (Editing it clears this approval.)</span>
                  </label>
                </div>
              );
            })}

            {steps.length < MAX_STEPS && (
              <button
                type="button"
                onClick={addStep}
                className="px-4 py-2 text-sm font-medium text-[#1B365D] border border-dashed border-[#1B365D] rounded-lg hover:bg-blue-50"
              >
                + Add email
              </button>
            )}
          </section>
        </fieldset>

        {/* Launch / controls */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4" aria-labelledby="controls-heading">
          <h2 id="controls-heading" className="text-lg font-semibold text-gray-800">4. Save &amp; launch</h2>

          <div aria-live="polite">{message?.at === "controls" && renderMessage()}</div>

          {status === "draft" && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={busy !== null}
                  className="px-6 py-2.5 bg-[#1B365D] text-white font-medium rounded-lg hover:bg-[#243f6b] disabled:opacity-50"
                >
                  {busy === "save" ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingLaunch(true)}
                  disabled={!canLaunch || busy !== null}
                  aria-describedby={launchHint ? "launch-hint" : undefined}
                  className="px-6 py-2.5 bg-[#D4A020] text-white font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Launch campaign…
                </button>
              </div>
              {launchHint && <p id="launch-hint" className="text-sm text-gray-500">{launchHint}</p>}
            </>
          )}

          {confirmingLaunch && (
            <div
              role="alertdialog"
              aria-modal="false"
              aria-labelledby="launch-title"
              aria-describedby="launch-desc"
              className="border-2 border-[#D4A020] bg-yellow-50 rounded-lg p-5 space-y-3"
            >
              <h3 id="launch-title" className="font-semibold text-gray-900">Launch this campaign?</h3>
              <p id="launch-desc" className="text-sm text-gray-700">
                {steps.length} email{steps.length === 1 ? "" : "s"} will be sent to <strong>{audienceCount}</strong> subscribed
                contact{audienceCount === 1 ? "" : "s"}. The first email goes out{" "}
                <strong>{firstSend ? formatInZone(firstSend, timezone) : "—"}</strong>
                {eventStart && <> and the event starts {formatInZone(eventStart, timezone)}</>}. Anyone who unsubscribes before a send is
                skipped. You can pause at any time.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => act("launch")}
                  disabled={busy !== null}
                  className="px-5 py-2 bg-[#D4A020] text-white font-semibold rounded-lg hover:brightness-110 disabled:opacity-50"
                >
                  {busy === "launch" ? "Launching…" : "Yes, launch"}
                </button>
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={() => setConfirmingLaunch(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Not yet
                </button>
              </div>
            </div>
          )}

          {(status === "active" || status === "paused") && (
            <div className="flex flex-wrap items-center gap-3">
              {status === "active" ? (
                <button
                  type="button"
                  onClick={() => act("pause")}
                  disabled={busy !== null}
                  className="px-5 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:brightness-110 disabled:opacity-50"
                >
                  {busy === "pause" ? "Pausing…" : "Pause"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => act("resume")}
                  disabled={busy !== null}
                  className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:brightness-110 disabled:opacity-50"
                >
                  {busy === "resume" ? "Resuming…" : "Resume"}
                </button>
              )}
              <button
                type="button"
                onClick={() => act("cancel")}
                disabled={busy !== null}
                className="px-5 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Cancel campaign
              </button>
              <button
                type="button"
                onClick={refresh}
                disabled={busy !== null}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {busy === "refresh" ? "Refreshing…" : "Refresh"}
              </button>
              {status === "paused" && (
                <p className="text-sm text-gray-500 w-full">
                  Resuming sends any step that came due while paused (unless the event has started). Steps already sent are never resent.
                </p>
              )}
            </div>
          )}

          {stats && campaignId && status !== "draft" && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                ["Enrolled", Object.values(stats.enrollments).reduce((a, b) => a + b, 0)],
                ["Sent", stats.sends.sent ?? 0],
                ["Failed", stats.sends.failed ?? 0],
                ["Needs review (uncertain)", stats.sends.uncertain ?? 0],
                ["Skipped", stats.sends.skipped ?? 0],
                ["Unsubscribed", stats.enrollments.unsubscribed ?? 0],
                ["Completed", stats.enrollments.completed ?? 0],
                ["In progress", stats.sends.sending ?? 0],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-gray-50 rounded-lg p-3">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="text-lg font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <div className="text-center">
          <Link href="/email/campaigns" className="px-4 py-2 text-[#1B365D] hover:underline">
            &larr; All campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}
