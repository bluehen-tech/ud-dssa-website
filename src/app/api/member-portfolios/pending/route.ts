import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/** GET /api/member-portfolios/pending — list pending portfolios (admin only) */
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_flag')
      .eq('id', user.id)
      .single();

    if (!profile?.admin_flag) {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    const { data: rows, error } = await supabase
      .from('member_portfolios')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending portfolios:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch pending portfolios' }, { status: 500 });
    }

    return NextResponse.json({ success: true, portfolios: rows ?? [] });
  } catch (err) {
    console.error('GET /api/member-portfolios/pending:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
