"use client";

import { useState, useRef, useCallback } from "react";
import {
  FLYER_WIDTH,
  altFromFilename,
  buildImageHtml,
  normaliseHttpUrl,
  uploadEmailImage,
  validateImageFile,
} from "@/lib/emailImages";

interface ImageUploaderProps {
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

interface UploadItem {
  id: string;
  name: string;
  preview: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
  alt: string;
  link: string;
}

const SIZE_PRESETS = [
  { label: "Small", width: 160 },
  { label: "Medium", width: 320 },
  { label: "Large", width: 480 },
  { label: "Full width", width: 600 },
] as const;

export default function ImageUploader({ onInsert, onClose }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [flyerMode, setFlyerMode] = useState(false);
  const [selectedWidth, setSelectedWidth] = useState(320);
  const [rejected, setRejected] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const uploadFiles = useCallback(
    (files: File[]) => {
      setFormError(null);
      const problems: string[] = [];
      const accepted: File[] = [];
      for (const file of files) {
        const problem = validateImageFile(file);
        if (problem) problems.push(problem);
        else accepted.push(file);
      }
      setRejected(problems);

      const newItems: UploadItem[] = accepted.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        preview: URL.createObjectURL(file),
        status: "uploading",
        alt: flyerMode ? "" : altFromFilename(file.name),
        link: "",
      }));
      setItems((prev) => [...prev, ...newItems]);

      // Upload in parallel; each item reports its own result.
      newItems.forEach((item, i) => {
        uploadEmailImage(accepted[i])
          .then((url) => updateItem(item.id, { status: "done", url }))
          .catch((err: unknown) =>
            updateItem(item.id, {
              status: "error",
              error: err instanceof Error ? err.message : "Upload failed",
            })
          );
      });
    },
    [flyerMode, updateItem]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) uploadFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadFiles(files);
    e.target.value = "";
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const doneItems = items.filter((it) => it.status === "done");
  const isUploading = items.some((it) => it.status === "uploading");
  const width = flyerMode ? FLYER_WIDTH : selectedWidth;

  const handleInsert = () => {
    setFormError(null);
    const parts: string[] = [];

    for (const it of doneItems) {
      const alt = it.alt.trim();
      if (flyerMode && !alt) {
        setFormError(`Add a descriptive alt text for "${it.name}" (required for flyers).`);
        return;
      }
      let link: string | undefined;
      if (it.link.trim()) {
        const normalised = normaliseHttpUrl(it.link);
        if (!normalised) {
          setFormError(`The link for "${it.name}" must start with http:// or https://`);
          return;
        }
        link = normalised;
      }
      parts.push(buildImageHtml({ url: it.url!, alt: alt || "Image", width, link }));
    }

    if (!parts.length) return;
    onInsert(parts.join("\n\n"));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Upload Images</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Image", value: false, hint: "Choose a display size" },
              { label: "Flyer", value: true, hint: "Full width (600px), alt text required" },
            ].map((mode) => (
              <button
                key={mode.label}
                type="button"
                onClick={() => setFlyerMode(mode.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  flyerMode === mode.value
                    ? "bg-[#1B365D] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {mode.label}
                <span className="block text-xs opacity-70 font-normal">{mode.hint}</span>
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
              items.length ? "p-4" : "p-8"
            } ${
              isDragging
                ? "border-[#1B365D] bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {!items.length && (
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <p className="text-sm font-medium text-gray-700">
              Drop images here or <span className="text-[#1B365D] underline">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP up to 5MB each. Select several at once.</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Items */}
          {items.length > 0 && (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.id} className="flex gap-3 border border-gray-200 rounded-lg p-3">
                  <img
                    src={it.preview}
                    alt=""
                    className="w-16 h-16 object-cover rounded-md border border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{it.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    {it.status === "uploading" && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B365D]" />
                        Uploading...
                      </div>
                    )}

                    {it.status === "error" && (
                      <p className="text-xs text-red-600">{it.error}</p>
                    )}

                    {it.status === "done" && (
                      <>
                        <input
                          type="text"
                          value={it.alt}
                          onChange={(e) => updateItem(it.id, { alt: e.target.value })}
                          placeholder={flyerMode ? "Alt text (required) e.g. Spring Social flyer, May 3 at 6pm" : "Alt text"}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                        />
                        <input
                          type="url"
                          value={it.link}
                          onChange={(e) => updateItem(it.id, { link: e.target.value })}
                          placeholder="Link this image to (optional) https://..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Size presets (hidden in flyer mode) */}
          {doneItems.length > 0 && !flyerMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.width}
                    type="button"
                    onClick={() => setSelectedWidth(preset.width)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedWidth === preset.width
                        ? "bg-[#1B365D] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {preset.label}
                    <span className="block text-xs opacity-70">{preset.width}px</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Insert button */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleInsert}
              disabled={isUploading || doneItems.length === 0}
              className="w-full px-4 py-2.5 bg-[#D4A020] text-white font-medium rounded-lg hover:brightness-110 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading
                ? "Uploading..."
                : `Insert ${doneItems.length} ${flyerMode ? "Flyer" : "Image"}${doneItems.length === 1 ? "" : "s"}`}
            </button>
          )}

          {/* Errors */}
          {(formError || rejected.length > 0) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm space-y-1">
              {formError && <p>{formError}</p>}
              {rejected.map((r) => (
                <p key={r}>{r}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
