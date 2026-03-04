import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { MemberPortfolioRow } from '@/types/member';

const RESUME_BUCKET =
  process.env.SUPABASE_RESUME_BUCKET ||
  process.env.NEXT_PUBLIC_SUPABASE_RESUME_BUCKET ||
  'member-resumes';

/**
 * GET /api/member-portfolios/[id]/resume
 * - Public can view only published portfolio resumes.
 * - Admin can view resume for any status.
 * - Returns a short-lived signed URL redirect.
 */
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
      .select('id, status, resume_path, resume_filename')
      .eq('id', id);

    if (!isAdmin) {
      query = query.eq('status', 'published');
    }

    const { data: row, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to fetch portfolio resume' }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ success: false, message: 'Portfolio not found' }, { status: 404 });
    }

    const portfolio = row as Pick<MemberPortfolioRow, 'resume_path' | 'resume_filename'>;
    if (!portfolio.resume_path) {
      return NextResponse.json({ success: false, message: 'Resume not available' }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(portfolio.resume_path, 60 * 10);

    if (signError || !signed?.signedUrl) {
      const message = signError?.message || 'Failed to access resume file';
      if (message.toLowerCase().includes('bucket not found')) {
        return NextResponse.json(
          {
            success: false,
            message: `Storage bucket '${RESUME_BUCKET}' not found. Create it in Supabase Storage or set SUPABASE_RESUME_BUCKET to the correct bucket name.`,
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: false, message }, { status: 500 });
    }

    return NextResponse.redirect(signed.signedUrl);
  } catch (err) {
    console.error('GET /api/member-portfolios/[id]/resume:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
