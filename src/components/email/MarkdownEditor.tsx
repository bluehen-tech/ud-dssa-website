"use client";

import { useRef, useState, useCallback } from "react";
import ImageUploader from "./ImageUploader";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarAction {
  icon: React.ReactNode;
  title: string;
  action: (textarea: HTMLTextAreaElement, value: string) => string;
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  before: string,
  after: string,
  placeholder: string
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || placeholder;
  return value.slice(0, start) + before + selected + after + value.slice(end);
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  value: string,
  text: string
): string {
  const pos = textarea.selectionStart;
  return value.slice(0, pos) + text + value.slice(pos);
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);

  const handleImageInsert = useCallback(
    (markdown: string) => {
      if (!textareaRef.current) return;
      const newVal = insertAtCursor(textareaRef.current, value, "\n" + markdown + "\n");
      onChange(newVal);
    },
    [value, onChange]
  );

  const toolbarActions: ToolbarAction[] = [
    {
      icon: <span className="font-bold">B</span>,
      title: "Bold",
      action: (ta, v) => wrapSelection(ta, v, "**", "**", "bold text"),
    },
    {
      icon: <span className="italic">I</span>,
      title: "Italic",
      action: (ta, v) => wrapSelection(ta, v, "*", "*", "italic text"),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4" />
        </svg>
      ),
      title: "Heading",
      action: (ta, v) => {
        const pos = ta.selectionStart;
        const lineStart = v.lastIndexOf("\n", pos - 1) + 1;
        return v.slice(0, lineStart) + "## " + v.slice(lineStart);
      },
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" />
        </svg>
      ),
      title: "Bullet list",
      action: (ta, v) => {
        const pos = ta.selectionStart;
        const lineStart = v.lastIndexOf("\n", pos - 1) + 1;
        return v.slice(0, lineStart) + "- " + v.slice(lineStart);
      },
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
        </svg>
      ),
      title: "Link",
      action: (ta, v) => wrapSelection(ta, v, "[", "](https://)", "link text"),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      ),
      title: "Horizontal rule",
      action: (ta, v) => insertAtCursor(ta, v, "\n\n---\n\n"),
    },
  ];

  const handleToolbarClick = (action: ToolbarAction) => {
    if (!textareaRef.current) return;
    const newVal = action.action(textareaRef.current, value);
    onChange(newVal);
    textareaRef.current.focus();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
        {toolbarActions.map((action, i) => (
          <button
            key={i}
            type="button"
            title={action.title}
            onClick={() => handleToolbarClick(action)}
            className="p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 hover:text-[#1B365D] transition-all"
          >
            {action.icon}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          type="button"
          title="Upload image"
          onClick={() => setShowImageUploader(true)}
          className="p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 hover:text-[#1B365D] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Write your email in Markdown...\n\n## Heading\n**Bold** and *italic*\n- List items\n---"}
        rows={16}
        className="w-full px-4 py-3 text-sm font-mono text-gray-800 resize-y focus:outline-none placeholder:text-gray-400"
        style={{ minHeight: "320px" }}
      />

      {/* Image uploader modal */}
      {showImageUploader && (
        <ImageUploader
          onInsert={handleImageInsert}
          onClose={() => setShowImageUploader(false)}
        />
      )}
    </div>
  );
}
