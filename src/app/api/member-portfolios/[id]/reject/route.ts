import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/** POST /api/member-portfolios/[id]/reject — set status to rejected (admin only) */
export async function POST(
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

    let body: { rejection_reason?: string } = {};
    try {
      body = await request.json();
    } catch {
      // optional body
    }

    const rejectionReason = body.rejection_reason?.trim();
    if (!rejectionReason) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const { data: row, error } = await supabase
      .from('member_portfolios')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        approved_at: null,
        approved_by: null,
      })
      .eq('id', id)
      .eq('status', 'published')
      .select()
      .single();

    if (error) {
      console.error('Error rejecting portfolio:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    if (!row) {
      return NextResponse.json({ success: false, message: 'Portfolio not found or not published' }, { status: 404 });
    }

    return NextResponse.json({ success: true, portfolio: row });
  } catch (err) {
    console.error('POST /api/member-portfolios/[id]/reject:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
