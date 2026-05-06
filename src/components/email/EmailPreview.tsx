"use client";

import { useMemo } from "react";
import { marked } from "marked";

interface EmailPreviewProps {
  subject: string;
  body: string;
  senderLabel: string;
  previewName?: string;
  previewEmail?: string;
}

marked.setOptions({ breaks: true, gfm: true });

const PREVIEW_TOKEN_REGEX = /\{(name|first_name|email)(?:\|([^}]*))?\}/g;

function personalise(text: string, name: string, email: string): string {
  const firstName = name.split(/\s+/)[0] || "";
  const values: Record<string, string> = { name, first_name: firstName, email };

  return text.replace(PREVIEW_TOKEN_REGEX, (_match, token: string, inlineOverride?: string) => {
    const value = values[token];
    if (value) return value;
    if (inlineOverride !== undefined) return inlineOverride;
    return token === "email" ? "" : "DSSA Member";
  });
}

/**
 * Client-side markdown to inline-styled HTML for preview.
 * Mirrors the server-side markdownToEmailHtml() from uddssaMailer.ts.
 */
function markdownToPreviewHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown) as string;

  return rawHtml
    .replace(/<h1(.*?)>/g, '<h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#1B365D;line-height:1.3;">')
    .replace(/<h2(.*?)>/g, '<h2 style="margin:24px 0 12px;font-size:22px;font-weight:600;color:#1B365D;line-height:1.3;">')
    .replace(/<h3(.*?)>/g, '<h3 style="margin:20px 0 8px;font-size:18px;font-weight:600;color:#1B365D;line-height:1.3;">')
    .replace(/<p(.*?)>/g, '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333333;">')
    .replace(/<ul(.*?)>/g, '<ul style="margin:0 0 16px;padding-left:24px;color:#333333;">')
    .replace(/<ol(.*?)>/g, '<ol style="margin:0 0 16px;padding-left:24px;color:#333333;">')
    .replace(/<li(.*?)>/g, '<li style="margin:0 0 8px;font-size:16px;line-height:1.5;">')
    .replace(/<a /g, '<a style="color:#1B365D;font-weight:500;text-decoration:underline;" ')
    .replace(/<hr\s*\/?>/g, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />')
    .replace(/<blockquote(.*?)>/g, '<blockquote style="margin:16px 0;padding:12px 20px;border-left:4px solid #D4A020;background:#f8f9fa;font-style:italic;color:#555555;">')
    .replace(/<img /g, '<img style="max-width:100%;height:auto;border-radius:8px;display:block;margin:16px auto;" ')
    .replace(/<strong(.*?)>/g, '<strong style="font-weight:600;color:#1a1a1a;">')
    .replace(/<em(.*?)>/g, '<em style="font-style:italic;">');
}

export default function EmailPreview({
  subject,
  body,
  senderLabel,
  previewName = "John",
  previewEmail = "john@udel.edu",
}: EmailPreviewProps) {
  const renderedBody = useMemo(() => {
    const personalised = personalise(body, previewName, previewEmail);
    return markdownToPreviewHtml(personalised);
  }, [body, previewName, previewEmail]);

  return (
    <div className="bg-[#f4f6f9] rounded-xl p-6 overflow-auto">
      {/* Email container */}
      <div
        className="mx-auto bg-white rounded-xl overflow-hidden shadow-lg"
        style={{ maxWidth: 600 }}
      >
        {/* Header */}
        <div
          className="text-center"
          style={{
            background: "#0d1031",
            padding: "20px 24px 16px",
            borderRadius: "12px 12px 0 0",
          }}
        >
          <p style={{ margin: 0, fontSize: 42, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            DSSA
          </p>
          <div style={{ width: 80, height: 3, background: "#D4A020", margin: "4px auto" }} />
          <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" as const }}>
            Data Science Student Association
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            University of Delaware
          </p>
          <div style={{ marginTop: 10 }}>
            <span style={{ display: "inline-block", background: "#D4A020", borderRadius: 4, padding: "6px 18px", fontSize: 13, fontWeight: 700, color: "#0d1031", letterSpacing: "0.5px" }}>
              {senderLabel}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>
            <a href="https://bluehen-dssa.org" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
              bluehen-dssa.org
            </a>
          </p>
        </div>

        {/* Subject */}
        {subject && (
          <div className="px-8 pt-6 pb-2">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Subject</p>
            <p className="text-lg font-semibold text-gray-900">{personalise(subject, previewName, previewEmail)}</p>
          </div>
        )}

        {/* Body */}
        <div
          className="px-8 pb-8 pt-4"
          dangerouslySetInnerHTML={{ __html: renderedBody }}
        />

        {/* Footer */}
        <div
          className="text-center border-t border-gray-200"
          style={{ padding: "20px 32px", backgroundColor: "#f9fafb" }}
        >
          <p className="text-sm text-gray-500 font-medium mb-2">
            Data Science Student Association @ University of Delaware
          </p>
          <p className="text-xs text-gray-400">
            <span style={{ color: "#D4A020" }}>Unsubscribe</span>
            <span className="mx-2 text-gray-300">|</span>
            <span style={{ color: "#1B365D" }}>Visit bluehen-dssa.org</span>
          </p>
        </div>
      </div>

      {/* Preview badge */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Preview with sample name: <span className="font-medium">{previewName}</span>
      </p>
    </div>
  );
}
