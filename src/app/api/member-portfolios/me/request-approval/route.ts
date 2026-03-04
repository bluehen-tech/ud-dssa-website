import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/** POST /api/member-portfolios/me/request-approval — call request_portfolio_approval() RPC */
export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.rpc('request_portfolio_approval');

    if (error) {
      console.error('request_portfolio_approval RPC error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Submitted for approval' });
  } catch (err) {
    console.error('POST /api/member-portfolios/me/request-approval:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
