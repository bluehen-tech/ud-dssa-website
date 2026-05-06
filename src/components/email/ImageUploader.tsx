"use client";

import { useState, useRef, useCallback } from "react";

interface ImageUploaderProps {
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

const SIZE_PRESETS = [
  { label: "Small", width: 160 },
  { label: "Medium", width: 320 },
  { label: "Large", width: 480 },
  { label: "Full width", width: 600 },
] as const;

export default function ImageUploader({ onInsert, onClose }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [selectedWidth, setSelectedWidth] = useState(320);
  const [altText, setAltText] = useState("Image");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/email/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      setUploadedUrl(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        uploadFile(file);
      } else {
        setError("Please drop an image file (jpg, png, gif, webp)");
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleInsert = () => {
    if (!uploadedUrl) return;

    const sizeParam = `?width=${selectedWidth}`;
    const renderUrl = uploadedUrl.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    ) + sizeParam;

    const md = `![${altText}](${renderUrl})`;
    onInsert(md);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Upload Image</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop zone */}
          {!uploadedUrl && !isUploading && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#1B365D] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Drop an image here or <span className="text-[#1B365D] underline">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B365D] mx-auto mb-3" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          )}

          {/* Preview + options */}
          {uploadedUrl && (
            <>
              <div className="flex justify-center">
                <img
                  src={preview || uploadedUrl}
                  alt="Preview"
                  className="max-h-48 rounded-lg border border-gray-200 object-contain"
                />
              </div>

              {/* Alt text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt text
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-[#1B365D] focus:border-[#1B365D]"
                />
              </div>

              {/* Size presets */}
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

              {/* Insert button */}
              <button
                type="button"
                onClick={handleInsert}
                className="w-full px-4 py-2.5 bg-[#D4A020] text-white font-medium rounded-lg hover:brightness-110 transition-all shadow-sm"
              >
                Insert Image
              </button>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
