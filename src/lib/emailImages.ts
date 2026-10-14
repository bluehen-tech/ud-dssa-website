/** Client-side helpers for uploading images and building <img> markup for the email composer. */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // keep in sync with upload-image/route.ts
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const FLYER_WIDTH = 600;

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Returns the normalised URL if it is http(s), otherwise null. */
export function normaliseHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Build the HTML inserted into the markdown body. Optionally wraps the image in a link. */
export function buildImageHtml(opts: {
  url: string;
  alt: string;
  width: number;
  link?: string;
}): string {
  const img = `<img src="${escapeAttr(opts.url)}" alt="${escapeAttr(opts.alt)}" width="${opts.width}" />`;
  return opts.link ? `<a href="${escapeAttr(opts.link)}">${img}</a>` : img;
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: unsupported type (use jpg, png, gif or webp)`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 5MB)`;
  }
  return null;
}

/** Upload one image through /api/email/upload-image and return its public URL. */
export async function uploadEmailImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/email/upload-image", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Upload failed");
  }
  return data.url as string;
}

/** Turn "Spring Social Flyer.final.png" into "Spring Social Flyer final". */
export function altFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[-_.]+/g, " ").trim() || "Image";
}
