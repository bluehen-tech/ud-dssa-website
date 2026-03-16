import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/** POST /api/member-portfolios/me/request-approval — publish portfolio directly */
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

    const { error } = await supabase.rpc('publish_portfolio');

    if (error) {
      console.error('publish_portfolio RPC error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Portfolio published' });
  } catch (err) {
    console.error('POST /api/member-portfolios/me/request-approval:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
