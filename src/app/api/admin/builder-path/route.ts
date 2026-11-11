import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { STAGES, findQuestion } from '@/content/learn/stages';
import { currentStageId } from '@/lib/learn/access';
import { loadTipsWithAuthors } from '@/lib/learn/tip-authors';

export const dynamic = 'force-dynamic';

async function verifyAdmin() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { authorized: false as const, error: 'Not authenticated', status: 401 };
  }
  const { data: profile } = await supabase.from('profiles').select('admin_flag').eq('id', user.id).single();
  if (!profile?.admin_flag) {
    return { authorized: false as const, error: 'Admin access required', status: 403 };
  }
  return { authorized: true as const };
}

/**
 * GET /api/admin/builder-path
 * Admin-only overview: learners per stage, each learner's stage and last
 * activity, most-missed questions, recent tips, and each stage's last-checked date.
 */
export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    const admin = createAdminClient();
    const [progressRes, attemptsRes, profilesRes] = await Promise.all([
      admin.from('learn_progress').select('user_id, stage_id, passed_at'),
      admin
        .from('learn_attempts')
        .select('user_id, attempted_at, missed_question_ids')
        .order('attempted_at', { ascending: false })
        .limit(5000),
      admin.from('learn_profiles').select('user_id, github_username, tips_blocked'),
    ]);
    if (progressRes.error || attemptsRes.error || profilesRes.error) {
      console.error('builder-path admin query failed:', progressRes.error || attemptsRes.error || profilesRes.error);
      return NextResponse.json(
        { success: false, message: 'Could not read Builder Path tables. Has supabase/BUILDER_PATH_SETUP.sql been run?' },
        { status: 500 }
      );
    }

    const passedByUser = new Map<string, Set<number>>();
    const lastActivity = new Map<string, string>();
    const touch = (userId: string, at: string) => {
      const prev = lastActivity.get(userId);
      if (!prev || at > prev) lastActivity.set(userId, at);
    };

    for (const row of progressRes.data ?? []) {
      if (!passedByUser.has(row.user_id)) passedByUser.set(row.user_id, new Set());
      passedByUser.get(row.user_id)!.add(row.stage_id);
      touch(row.user_id, row.passed_at);
    }

    const missCounts = new Map<string, number>();
    for (const row of attemptsRes.data ?? []) {
      touch(row.user_id, row.attempted_at);
      for (const id of row.missed_question_ids ?? []) missCounts.set(id, (missCounts.get(id) ?? 0) + 1);
    }

    const profileByUser = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
    const userIds = Array.from(new Set([...Array.from(lastActivity.keys()), ...Array.from(profileByUser.keys())]));

    const [emailsRes, portfoliosRes] = await Promise.all([
      userIds.length ? admin.from('profiles').select('id, email').in('id', userIds) : Promise.resolve({ data: [] }),
      userIds.length
        ? admin.from('member_portfolios').select('id, user_id, name').in('user_id', userIds)
        : Promise.resolve({ data: [] }),
    ]);
    const emailByUser = new Map((emailsRes.data ?? []).map((p: { id: string; email: string }) => [p.id, p.email]));
    const portfolioByUser = new Map(
      (portfoliosRes.data ?? []).map((p: { id: string; user_id: string; name: string }) => [p.user_id, p])
    );

    const stageIds = STAGES.map((s) => s.id);
    const learners = userIds
      .map((userId) => {
        const passed = passedByUser.get(userId) ?? new Set<number>();
        const current = currentStageId(passed, stageIds);
        const profile = profileByUser.get(userId);
        const portfolio = portfolioByUser.get(userId);
        return {
          userId,
          name: portfolio?.name ?? null,
          portfolioId: portfolio?.id ?? null,
          email: emailByUser.get(userId) ?? null,
          githubUsername: profile?.github_username ?? null,
          tipsBlocked: Boolean(profile?.tips_blocked),
          currentStage: current,
          finished: current === null,
          lastActivity: lastActivity.get(userId) ?? null,
        };
      })
      .sort((a, b) => (b.lastActivity ?? '').localeCompare(a.lastActivity ?? ''));

    const stageCounts = STAGES.map((stage) => ({
      stageId: stage.id,
      title: stage.title,
      lastChecked: stage.lastChecked,
      learners: learners.filter((l) => l.currentStage === stage.id).length,
    }));

    const mostMissed = Array.from(missCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([questionId, misses]) => {
        const found = findQuestion(questionId);
        return {
          questionId,
          misses,
          stageId: found?.stage.id ?? null,
          prompt: found?.question.prompt ?? '(question removed)',
          concept: found?.question.concept ?? null,
        };
      });

    const recentTips = (await loadTipsWithAuthors()).slice(0, 20);

    return NextResponse.json({
      success: true,
      stageCounts,
      finishedCount: learners.filter((l) => l.finished).length,
      learners,
      mostMissed,
      recentTips,
    });
  } catch (error) {
    console.error('GET /api/admin/builder-path error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/builder-path
 * Body: { userId, tips_blocked }
 * A blocked learner's tip pull requests fail the eligibility check and wait for an officer.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    const body = (await request.json().catch(() => ({}))) as { userId?: unknown; tips_blocked?: unknown };
    if (typeof body.userId !== 'string' || typeof body.tips_blocked !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'userId and tips_blocked are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('learn_profiles')
      .upsert(
        { user_id: body.userId, tips_blocked: body.tips_blocked, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    if (error) {
      console.error('PATCH /api/admin/builder-path:', error);
      return NextResponse.json({ success: false, message: 'Failed to update learner' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: body.tips_blocked ? 'Tips from this learner are now blocked' : 'Tips from this learner are allowed again',
    });
  } catch (error) {
    console.error('PATCH /api/admin/builder-path error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
