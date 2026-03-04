import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { dbRowToMemberPortfolio } from '@/lib/memberPortfolioUtils';
import type { MemberPortfolioRow } from '@/types/member';

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
