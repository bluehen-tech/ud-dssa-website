"use client";

import { useMemo } from "react";
import { markdownToEmailHtml } from "@/lib/emailMarkdown";

interface EmailPreviewProps {
  subject: string;
  body: string;
  senderLabel: string;
  previewName?: string;
  previewEmail?: string;
}

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

export default function EmailPreview({
  subject,
  body,
  senderLabel,
  previewName = "John",
  previewEmail = "john@udel.edu",
}: EmailPreviewProps) {
  const renderedBody = useMemo(() => {
    const personalised = personalise(body, previewName, previewEmail);
    return markdownToEmailHtml(personalised);
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
          }}
        >
          <p style={{ margin: 0, fontSize: 42, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            DSSA
          </p>
          <div style={{ width: 80, height: 3, background: "#D4A020", margin: "4px auto" }} />
          <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 400, color: "#d9d9e8", letterSpacing: "1.5px", textTransform: "uppercase" as const }}>
            Data Science Student Association
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9a9ab0" }}>
            University of Delaware
          </p>
          <div style={{ marginTop: 10 }}>
            <span style={{ display: "inline-block", background: "#D4A020", borderRadius: 4, padding: "6px 18px", fontSize: 13, fontWeight: 700, color: "#0d1031", letterSpacing: "0.5px" }}>
              {senderLabel}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12 }}>
            <a href="https://bluehen-dssa.org" style={{ color: "#bfbfd0", textDecoration: "none" }}>
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
