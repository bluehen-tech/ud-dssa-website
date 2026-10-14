import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { dbRowToMemberPortfolio } from '@/lib/memberPortfolioUtils';
import type { MemberPortfolioRow, MemberRole } from '@/types/member';

const MEMBER_ROLES: MemberRole[] = ['officer', 'member', 'alumni'];

/** GET /api/member-portfolios/[id] — single published portfolio by id (public) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing portfolio id' }, { status: 400 });
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAdmin = false;
    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_flag')
        .eq('id', user.id)
        .maybeSingle();
      isAdmin = Boolean(profile?.admin_flag);
    }

    let query = supabase
      .from('member_portfolios')
      .select('*')
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('status', 'published');
    }

    const { data: row, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching member portfolio:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch portfolio' }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ success: false, message: 'Portfolio not found' }, { status: 404 });
    }

    const memberRow = row as MemberPortfolioRow;
    const portfolio = dbRowToMemberPortfolio(memberRow);
    return NextResponse.json({
      success: true,
      portfolio,
      status: memberRow.status,
      submitted_at: memberRow.submitted_at,
      rejection_reason: memberRow.rejection_reason,
    });
  } catch (err) {
    console.error('GET /api/member-portfolios/[id]:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** PATCH /api/member-portfolios/[id] — update membership status (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing portfolio id' }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_flag')
      .eq('id', user.id)
      .single();

    if (!profile?.admin_flag) {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    let body: { role?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    if (typeof body.role !== 'string' || !MEMBER_ROLES.includes(body.role as MemberRole)) {
      return NextResponse.json(
        { success: false, message: 'Membership status must be officer, member, or alumni' },
        { status: 400 }
      );
    }

    const role = body.role as MemberRole;
    const adminClient = createAdminClient();
    const { data: portfolio, error } = await adminClient
      .from('member_portfolios')
      .update({ role })
      .eq('id', id)
      .select('id, role')
      .maybeSingle();

    if (error) {
      console.error('Error updating portfolio membership status:', error);
      return NextResponse.json({ success: false, message: 'Failed to update membership status' }, { status: 500 });
    }

    if (!portfolio) {
      return NextResponse.json({ success: false, message: 'Portfolio not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Membership status updated',
      role: portfolio.role as MemberRole,
    });
  } catch (err) {
    console.error('PATCH /api/member-portfolios/[id]:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
