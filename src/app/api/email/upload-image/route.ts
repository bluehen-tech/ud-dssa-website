import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const BUCKET = "email-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** Detect the real image type from the file's leading bytes (magic numbers). */
function sniffImageType(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return "image/png";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "image/webp";
  return null;
}

/**
 * POST /api/email/upload-image
 *
 * Accepts a multipart form with a single image file, uploads it to Supabase
 * Storage, and returns the public URL.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("admin_flag")
      .eq("id", user.id)
      .single();

    if (!profile?.admin_flag) {
      return NextResponse.json(
        { success: false, message: "Forbidden – admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: `Invalid file type: ${file.type}. Allowed: jpg, png, gif, webp` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Trust the file's actual bytes, not the client-supplied type or filename.
    const detectedType = sniffImageType(buffer);
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return NextResponse.json(
        { success: false, message: "File contents are not a valid jpg, png, gif or webp image" },
        { status: 400 }
      );
    }

    const ext = EXT_BY_TYPE[detectedType];
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2, 10);
    const filePath = `${timestamp}-${randomId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: detectedType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload-image] Supabase upload error:", uploadError);
      return NextResponse.json(
        { success: false, message: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filePath,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[POST /api/email/upload-image]", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
