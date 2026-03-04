import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/** POST /api/member-portfolios/[id]/approve — set status to published (admin only) */
export async function POST(
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

    const { data: row, error } = await supabase
      .from('member_portfolios')
      .update({
        status: 'published',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        rejection_reason: null,
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('Error approving portfolio:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    if (!row) {
      return NextResponse.json({ success: false, message: 'Portfolio not found or not pending' }, { status: 404 });
    }

    return NextResponse.json({ success: true, portfolio: row });
  } catch (err) {
    console.error('POST /api/member-portfolios/[id]/approve:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
