import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * GET /api/email/sent
 *
 * Returns sent emails for the admin panel. Requires admin authentication.
 */
export async function GET() {
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

    const { data: emails, error } = await supabase
      .from("sent_emails")
      .select("id, slug, subject, email_type, sender_label, recipient_count, sent_at, published")
      .order("sent_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emails: emails || [] });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PATCH /api/email/sent
 *
 * Toggle published status of a sent email. Requires admin authentication.
 * Body: { id: string, published: boolean }
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { id, published } = body;

    if (!id || typeof published !== "boolean") {
      return NextResponse.json(
        { success: false, message: "id (string) and published (boolean) are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("sent_emails")
      .update({ published })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
