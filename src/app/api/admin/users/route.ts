import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

async function verifyAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false as const, error: 'Not authenticated', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('admin_flag')
    .eq('id', user.id)
    .single();

  if (!profile?.admin_flag) {
    return { authorized: false as const, error: 'Admin access required', status: 403 };
  }

  return { authorized: true as const, user };
}

/**
 * GET /api/admin/users
 * Returns all profiles. Admin-only.
 */
export async function GET() {
  try {
    const supabase = createClient();
    const auth = await verifyAdmin(supabase);

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const adminClient = createAdminClient();
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('id, email, admin_flag, email_access_flag, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, users: profiles ?? [] });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update a user's admin_flag and/or email_access_flag.
 *
 * Body: { userId: string, admin_flag?: boolean, email_access_flag?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const auth = await verifyAdmin(supabase);

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { userId, admin_flag, email_access_flag } = body as {
      userId?: string;
      admin_flag?: boolean;
      email_access_flag?: boolean;
    };

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    if (admin_flag === undefined && email_access_flag === undefined) {
      return NextResponse.json(
        { success: false, message: 'Nothing to update' },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (userId === auth.user.id && admin_flag === false) {
      return NextResponse.json(
        { success: false, message: 'You cannot remove your own admin access' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify target user exists
    const { data: target, error: targetError } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (targetError || !target) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Build update payload — only include fields that were provided
    const updatePayload: Record<string, boolean> = {};
    if (admin_flag !== undefined) updatePayload.admin_flag = admin_flag;
    if (email_access_flag !== undefined) updatePayload.email_access_flag = email_access_flag;

    const { error: updateError } = await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated permissions for ${target.email}`,
    });
  } catch (error) {
    console.error('PATCH /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
