import { createAdminClient } from '@/lib/supabase-admin';
import { COUNTED_STAGE_IDS } from '@/content/learn/stages';
import { tipUsernames } from './tips';
import type { BuilderBadge } from '@/types/member';

/**
 * Builder Path badge per user, derived from learn_progress and the tips
 * folder. Neither is something a member can write. Returns an empty map if
 * the service-role key is missing, so the members pages still load.
 */
export async function getBuilderBadges(userIds: string[]): Promise<Map<string, BuilderBadge>> {
  const badges = new Map<string, BuilderBadge>();
  if (userIds.length === 0) return badges;

  try {
    const admin = createAdminClient();
    const [progressRes, profileRes] = await Promise.all([
      admin.from('learn_progress').select('user_id, stage_id').in('user_id', userIds).gt('stage_id', 0),
      admin.from('learn_profiles').select('user_id, github_username').in('user_id', userIds),
    ]);

    const levels = new Map<string, number>();
    for (const row of progressRes.data ?? []) {
      if (COUNTED_STAGE_IDS.includes(row.stage_id)) {
        levels.set(row.user_id, (levels.get(row.user_id) ?? 0) + 1);
      }
    }

    const merged = tipUsernames();
    const contributors = new Set(
      (profileRes.data ?? [])
        .filter((p) => p.github_username && merged.has(p.github_username))
        .map((p) => p.user_id)
    );

    for (const userId of userIds) {
      const level = levels.get(userId) ?? 0;
      const contributor = contributors.has(userId);
      if (level > 0 || contributor) {
        badges.set(userId, { level, total: COUNTED_STAGE_IDS.length, contributor });
      }
    }
  } catch (err) {
    console.error('getBuilderBadges:', err);
  }

  return badges;
}
