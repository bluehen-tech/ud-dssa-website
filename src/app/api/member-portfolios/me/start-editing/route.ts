import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/member-portfolios/me/start-editing
 * Move a published portfolio back to draft so member can edit and resubmit.
 */
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

    const { error } = await supabase.rpc('start_portfolio_editing');

    if (error) {
      const isMissingFunction = /could not find the function public\.start_portfolio_editing/i.test(
        error.message || ''
      );

      if (isMissingFunction) {
        const { error: fallbackError } = await supabase
          .from('member_portfolios')
          .update({
            status: 'draft',
            submitted_at: null,
            approved_at: null,
            approved_by: null,
          })
          .eq('user_id', user.id)
          .eq('status', 'published')
          .select('id')
          .maybeSingle();

        if (!fallbackError) {
          return NextResponse.json({
            success: true,
            message: 'Portfolio is now editable as draft',
          });
        }
      }

      console.error('start_portfolio_editing RPC error:', error);
      return NextResponse.json(
        {
          success: false,
          message: isMissingFunction
            ? 'Database function start_portfolio_editing() is missing. Run supabase/migrations/20260304_enable_published_reedit_transition.sql in Supabase SQL Editor, then retry.'
            : error.message ||
              'Unable to start editing. Ensure the published-to-draft transition policy and RPC are applied in Supabase.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Portfolio is now editable as draft' });
  } catch (err) {
    console.error('POST /api/member-portfolios/me/start-editing:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
