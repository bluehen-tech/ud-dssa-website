import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { FINAL_STAGE_ID } from '@/content/learn/stages';
import { GITHUB_USERNAME_PATTERN } from '@/lib/learn/constants';

export const dynamic = 'force-dynamic';

type Reason = 'invalid-username' | 'unknown-username' | 'stage-locked' | 'blocked';

/**
 * GET /api/learn/eligible?username=<github-username>
 * Public. Called by .github/workflows/merge-tip.yml before it merges a tip.
 * Answers whether this GitHub username belongs to a learner who has passed
 * the Stage 7 check and is not blocked from adding tips.
 */
export async function GET(request: NextRequest) {
  const answer = (eligible: boolean, reason?: Reason) =>
    NextResponse.json({ eligible, ...(reason ? { reason } : {}) }, { headers: { 'Cache-Control': 'no-store' } });

  const username = (request.nextUrl.searchParams.get('username') ?? '').trim().toLowerCase();
  if (!GITHUB_USERNAME_PATTERN.test(username)) return answer(false, 'invalid-username');

  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from('learn_profiles')
      .select('user_id, tips_blocked')
      .eq('github_username', username)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return answer(false, 'unknown-username');
    if (profile.tips_blocked) return answer(false, 'blocked');

    const { data: progress, error: progressError } = await admin
      .from('learn_progress')
      .select('stage_id')
      .eq('user_id', profile.user_id)
      .eq('stage_id', FINAL_STAGE_ID)
      .maybeSingle();
    if (progressError) throw progressError;
    if (!progress) return answer(false, 'stage-locked');

    return answer(true);
  } catch (err) {
    console.error('GET /api/learn/eligible:', err);
    return NextResponse.json({ eligible: false, message: 'Server error' }, { status: 500 });
  }
}
