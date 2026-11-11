import { createAdminClient } from '@/lib/supabase-admin';
import { loadTips, type TipNote } from './tips';

export interface TipWithAuthor extends TipNote {
  mergedAt: string | null;
  authorName: string | null;
  portfolioId: string | null;
}

/**
 * Joins each tip file to its author: learn_profiles by GitHub username, then
 * the author's published portfolio for a name and link. Newest merge first.
 */
export async function loadTipsWithAuthors(): Promise<TipWithAuthor[]> {
  const tips = loadTips();
  if (tips.length === 0) return [];

  const byUsername = new Map<string, { userId: string; mergedAt: string | null }>();
  const portfolioByUser = new Map<string, { id: string; name: string }>();

  try {
    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from('learn_profiles')
      .select('user_id, github_username, tip_merged_at')
      .in('github_username', tips.map((t) => t.username));
    for (const p of profiles ?? []) {
      byUsername.set(p.github_username, { userId: p.user_id, mergedAt: p.tip_merged_at });
    }

    const userIds = Array.from(byUsername.values()).map((v) => v.userId);
    if (userIds.length > 0) {
      const { data: portfolios } = await admin
        .from('member_portfolios')
        .select('id, user_id, name')
        .eq('status', 'published')
        .in('user_id', userIds);
      for (const p of portfolios ?? []) portfolioByUser.set(p.user_id, { id: p.id, name: p.name });
    }
  } catch (err) {
    console.error('loadTipsWithAuthors:', err);
  }

  return tips
    .map((tip) => {
      const author = byUsername.get(tip.username);
      const portfolio = author ? portfolioByUser.get(author.userId) : undefined;
      return {
        ...tip,
        mergedAt: author?.mergedAt ?? null,
        authorName: portfolio?.name ?? null,
        portfolioId: portfolio?.id ?? null,
      };
    })
    .sort((a, b) => {
      if (a.mergedAt && b.mergedAt) return b.mergedAt.localeCompare(a.mergedAt);
      if (a.mergedAt) return -1;
      if (b.mergedAt) return 1;
      return a.username.localeCompare(b.username);
    });
}
