import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Server-side admin gate for API routes. Verifies the session with Supabase
 * (not just the cookie) and requires profiles.admin_flag.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("admin_flag")
    .eq("id", user.id)
    .single();

  if (!profile?.admin_flag) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: "Forbidden – admin access required" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
