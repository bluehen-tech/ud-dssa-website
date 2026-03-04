import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { bodyToPortfolioUpdate, dbRowToMemberPortfolio } from '@/lib/memberPortfolioUtils';
import type { MemberPortfolioRow } from '@/types/member';

/** GET /api/member-portfolios/me — return current user's portfolio (any status) or 404 */
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: row, error } = await supabase
      .from('member_portfolios')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member portfolio:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch portfolio' }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ success: true, portfolio: null });
    }

    const r = row as MemberPortfolioRow;
    return NextResponse.json({
      success: true,
      portfolio: { ...r, display: dbRowToMemberPortfolio(r) },
    });
  } catch (err) {
    console.error('GET /api/member-portfolios/me:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** PATCH /api/member-portfolios/me — update current user's portfolio (content only, draft/rejected only) */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
    }

    const update = bodyToPortfolioUpdate(body);
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from('member_portfolios')
      .update(update)
      .eq('user_id', user.id)
      .in('status', ['draft', 'rejected'])
      .select()
      .single();

    if (error) {
      console.error('Error updating member portfolio:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    if (!row) {
      return NextResponse.json({ success: false, message: 'Portfolio not found or not editable (must be draft or rejected)' }, { status: 404 });
    }

    return NextResponse.json({ success: true, portfolio: row as MemberPortfolioRow });
  } catch (err) {
    console.error('PATCH /api/member-portfolios/me:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
