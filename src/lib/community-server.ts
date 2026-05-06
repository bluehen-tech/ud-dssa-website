import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import type { CommunityComment, CommunityMediaType, CommunityPost } from '@/types/community';

export const COMMUNITY_MEDIA_BUCKET =
  process.env.SUPABASE_COMMUNITY_MEDIA_BUCKET || 'community-media';

export const COMMUNITY_POST_LIMIT = 60;

export const COMMUNITY_SETUP_REQUIRED_MESSAGE =
  'DataTalk database tables are not set up yet. Run the SQL in docs/COMMUNITY_SETUP.md in your Supabase SQL Editor, then refresh this page.';

type SupabaseServerClient = ReturnType<typeof createClient>;

export interface CommunityActor {
  user: User | null;
  isAdmin: boolean;
  displayName: string;
  email: string | null;
}

export function isUuid(value: string | null | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      )
  );
}

export function isCommunitySchemaMissingError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as { code?: string; message?: string };
  const message = maybeError.message?.toLowerCase() || '';

  return (
    maybeError.code === 'PGRST205' ||
    maybeError.code === '42P01' ||
    message.includes('community_posts') ||
    message.includes('community_comments') ||
    message.includes('community_votes') ||
    message.includes('community_reports')
  );
}

export function sanitizeCommunityText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n/g, '\n').slice(0, maxLength);
}

export function sanitizeTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of rawTags) {
    if (typeof item !== 'string') continue;
    const tag = item
      .trim()
      .replace(/^#/, '')
      .replace(/[^a-zA-Z0-9 +#.-]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 28);

    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= 6) break;
  }

  return tags;
}

export function normalizeMediaType(value: unknown): CommunityMediaType | null {
  return value === 'image' || value === 'video' || value === 'embed' ? value : null;
}

export function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value || '', 10);
  if (Number.isNaN(parsed)) return COMMUNITY_POST_LIMIT;
  return Math.min(100, Math.max(1, parsed));
}

export function getDisplayName(user: User, profileEmail?: string | null) {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const metadataName = [metadata.full_name, metadata.name, metadata.display_name].find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  if (typeof metadataName === 'string') {
    return metadataName.trim().slice(0, 80);
  }

  const email = profileEmail || user.email;
  if (email) {
    const localPart = email.split('@')[0] || '';
    const readable = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (readable) {
      return readable
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
        .slice(0, 80);
    }
  }

  return 'DSSA Member';
}

export async function getOptionalCommunityActor(
  supabase: SupabaseServerClient
): Promise<CommunityActor> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      isAdmin: false,
      displayName: 'Visitor',
      email: null,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, admin_flag')
    .eq('id', user.id)
    .maybeSingle();

  const email = (profile as { email?: string | null } | null)?.email || user.email || null;

  return {
    user,
    isAdmin: (profile as { admin_flag?: boolean } | null)?.admin_flag === true,
    displayName: getDisplayName(user, email),
    email,
  };
}

export async function requireCommunityActor(supabase: SupabaseServerClient) {
  const actor = await getOptionalCommunityActor(supabase);
  if (!actor.user) {
    return { actor, error: 'Sign in with your UD email to continue.', status: 401 };
  }
  return { actor, error: null, status: 200 };
}

export function rowToCommunityPost(
  row: any,
  actor: CommunityActor,
  viewerHasUpvoted = false
): CommunityPost {
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    tags: Array.isArray(row.tags) ? row.tags.filter((tag: unknown) => typeof tag === 'string') : [],
    authorName: row.author_name || 'DSSA Member',
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
    mediaUrl: row.media_url || null,
    mediaPath: row.media_path || null,
    mediaType: normalizeMediaType(row.media_type),
    mediaName: row.media_name || null,
    isPinned: row.is_pinned === true,
    voteCount: Number(row.vote_count || 0),
    commentCount: Number(row.comment_count || 0),
    viewerHasUpvoted,
    viewerCanDelete: Boolean(actor.user && (actor.isAdmin || row.author_id === actor.user.id)),
    viewerCanModerate: actor.isAdmin,
  };
}

export function rowToCommunityComment(
  row: any,
  actor: CommunityActor,
  viewerHasUpvoted = false
): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id || null,
    content: row.content || '',
    authorName: row.author_name || 'DSSA Member',
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
    voteCount: Number(row.vote_count || 0),
    viewerHasUpvoted,
    viewerCanDelete: Boolean(actor.user && (actor.isAdmin || row.author_id === actor.user.id)),
  };
}
