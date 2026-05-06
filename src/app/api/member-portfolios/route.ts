import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { dbRowToMemberPortfolio } from '@/lib/memberPortfolioUtils';
import type { MemberPortfolio, MemberPortfolioRow, MemberRole } from '@/types/member';

const OFFICER_POSITION_PRIORITY = [
  'faculty advisor',
  'president',
  'vice president',
  'tech lead',
  'treasurer',
  'co-tech lead',
] as const;

function normalizeOfficerPosition(position: string | undefined) {
  return position
    ?.trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function getOfficerPriority(position: string | undefined) {
  const normalizedPosition = normalizeOfficerPosition(position);

  if (!normalizedPosition) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (normalizedPosition === 'faculty adviser') {
    return 0;
  }

  if (normalizedPosition === 'technical lead') {
    return 3;
  }

  if (normalizedPosition === 'co technical lead') {
    return 5;
  }

  const priorityIndex = OFFICER_POSITION_PRIORITY.indexOf(
    normalizedPosition as (typeof OFFICER_POSITION_PRIORITY)[number]
  );

  return priorityIndex === -1 ? Number.MAX_SAFE_INTEGER : priorityIndex;
}

function sortPortfolios(portfolios: MemberPortfolio[]) {
  return [...portfolios].sort((a, b) => {
    if (a.role === 'officer' && b.role === 'officer') {
      const rankDifference = getOfficerPriority(a.position) - getOfficerPriority(b.position);
      if (rankDifference !== 0) {
        return rankDifference;
      }
    }

    return a.name.localeCompare(b.name);
  });
}

/** GET /api/member-portfolios — list published portfolios only. Optional ?role=officer|member|alumni */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as MemberRole | null;

    let query = supabase
      .from('member_portfolios')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (role && ['officer', 'member', 'alumni'].includes(role)) {
      query = query.eq('role', role);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching member portfolios:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch portfolios' }, { status: 500 });
    }

    const portfolios = sortPortfolios(
      (rows ?? []).map((row) => dbRowToMemberPortfolio(row as MemberPortfolioRow))
    );
    return NextResponse.json({ success: true, portfolios });
  } catch (err) {
    console.error('GET /api/member-portfolios:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** POST /api/member-portfolios — create current user's portfolio as draft (one per user) */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get email from profiles or auth
    let email = user.email ?? null;
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();
    if (profile?.email) email = profile.email;

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Allow empty body for "create blank draft"
    }

    const insert: Record<string, unknown> = {
      user_id: user.id,
      status: 'draft',
      name: (body.name as string) || 'Untitled',
      role: (body.role as string) || 'member',
      email,
      position: body.position ?? null,
      tagline: body.tagline ?? null,
      major: body.major ?? null,
      graduation_date: body.graduation_date ?? null,
      bio: body.bio ?? null,
      profile_image_url: body.profile_image_url ?? null,
      links: body.links ?? {},
      skills: body.skills ?? [],
      experience: body.experience ?? [],
      education: body.education ?? [],
      projects: body.projects ?? [],
      achievements: body.achievements ?? [],
      interests: body.interests ?? [],
      tech_stack: body.tech_stack ?? {},
      career_interests: body.career_interests ?? {},
      portfolio_highlights: body.portfolio_highlights ?? [],
      contact_prefs: body.contact_prefs ?? {},
      resume_public: body.resume_public ?? true,
      resume_filename: body.resume_filename ?? null,
      resume_path: body.resume_path ?? null,
      resume_updated_at: body.resume_updated_at ?? null,
      resume_mime: body.resume_mime ?? null,
      resume_size: body.resume_size ?? null,
    };

    const { data: row, error } = await supabase
      .from('member_portfolios')
      .insert(insert)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'You already have a portfolio' }, { status: 409 });
      }
      console.error('Error creating member portfolio:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, portfolio: row as MemberPortfolioRow }, { status: 201 });
  } catch (err) {
    console.error('POST /api/member-portfolios:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
