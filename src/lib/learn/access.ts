import { createClient } from '@/lib/supabase-server';
import { isSupabaseConfigured } from '@/lib/supabase-config';

export type MissingStep = 'portfolio' | 'publish' | 'photo';

export interface LearnerState {
  userId: string;
  email: string | null;
  /** Steps still needed before the path unlocks. Empty means the path is open. */
  missing: MissingStep[];
  passed: Set<number>;
  githubUsername: string | null;
  tipsBlocked: boolean;
}

export type LearnerResult =
  | { ok: true; state: LearnerState }
  | { ok: false; reason: 'not-configured' | 'signed-out' };

/**
 * Reads the signed-in learner's gate status and progress with their own
 * session, so row-level security applies. Writes go through the service-role
 * client in the API routes, never from here.
 */
export async function getLearnerState(): Promise<LearnerResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'not-configured' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'signed-out' };

  const [portfolioRes, progressRes, profileRes] = await Promise.all([
    supabase
      .from('member_portfolios')
      .select('status, profile_image_url')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('learn_progress').select('stage_id').eq('user_id', user.id),
    supabase
      .from('learn_profiles')
      .select('github_username, tips_blocked')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const portfolio = portfolioRes.data as { status: string; profile_image_url: string | null } | null;
  const missing: MissingStep[] = [];
  if (!portfolio) {
    missing.push('portfolio', 'publish', 'photo');
  } else {
    if (portfolio.status !== 'published') missing.push('publish');
    if (!portfolio.profile_image_url?.trim()) missing.push('photo');
  }

  const passed = new Set<number>(
    ((progressRes.data as { stage_id: number }[] | null) ?? []).map((row) => row.stage_id)
  );
  const profile = profileRes.data as { github_username: string | null; tips_blocked: boolean } | null;

  return {
    ok: true,
    state: {
      userId: user.id,
      email: user.email ?? null,
      missing,
      passed,
      githubUsername: profile?.github_username ?? null,
      tipsBlocked: Boolean(profile?.tips_blocked),
    },
  };
}

/** A stage's lesson is open once the stage before it is passed. Stage 0 is always open. */
export function isStageOpen(stageId: number, passed: Set<number>): boolean {
  return stageId === 0 || passed.has(stageId - 1);
}

/** The first stage not yet passed, or null when every stage is passed. */
export function currentStageId(passed: Set<number>, stageIds: number[]): number | null {
  return stageIds.find((id) => !passed.has(id)) ?? null;
}
