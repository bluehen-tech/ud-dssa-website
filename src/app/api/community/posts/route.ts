import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  COMMUNITY_SETUP_REQUIRED_MESSAGE,
  getOptionalCommunityActor,
  isCommunitySchemaMissingError,
  parseLimit,
  requireCommunityActor,
  rowToCommunityPost,
  sanitizeCommunityText,
  sanitizeTags,
  normalizeMediaType,
} from '@/lib/community-server';
import type {
  CommunityPostResponse,
  CommunityPostsResponse,
  CommunitySort,
} from '@/types/community';

function sanitizeSearch(value: string | null) {
  return sanitizeCommunityText(value || '', 120).replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ');
}

function rowMatchesSearch(row: any, search: string) {
  if (!search) return true;

  const needle = search.toLowerCase();
  const haystack = [
    row.title,
    row.content,
    row.author_name,
    ...(Array.isArray(row.tags) ? row.tags : []),
  ]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<CommunityPostsResponse>> {
  try {
    const supabase = createClient();
    const actor = await getOptionalCommunityActor(supabase);
    const { searchParams } = new URL(request.url);
    const sort = (searchParams.get('sort') === 'popular' ? 'popular' : 'latest') as CommunitySort;
    const tag = sanitizeCommunityText(searchParams.get('tag') || '', 40);
    const search = sanitizeSearch(searchParams.get('search'));
    const limit = parseLimit(searchParams.get('limit'));

    let query = supabase
      .from('community_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(search ? Math.max(limit, 200) : limit);

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching community posts:', error);
      return NextResponse.json(
        {
          success: false,
          posts: [],
          message: isCommunitySchemaMissingError(error)
            ? COMMUNITY_SETUP_REQUIRED_MESSAGE
            : 'Failed to load community posts.',
        },
        { status: 500 }
      );
    }

    const rowList = (rows || []).filter((row: any) => rowMatchesSearch(row, search)).slice(0, limit);
    const postIds = rowList.map((row: any) => row.id);
    const votedPostIds = new Set<string>();

    if (actor.user && postIds.length > 0) {
      const { data: votes } = await supabase
        .from('community_votes')
        .select('post_id')
        .eq('user_id', actor.user.id)
        .in('post_id', postIds);

      for (const vote of votes || []) {
        if ((vote as { post_id?: string }).post_id) {
          votedPostIds.add((vote as { post_id: string }).post_id);
        }
      }
    }

    const posts = rowList.map((row: any) =>
      rowToCommunityPost(row, actor, votedPostIds.has(row.id))
    );

    if (sort === 'popular') {
      posts.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
        const aScore = a.voteCount * 2 + a.commentCount;
        const bScore = b.voteCount * 2 + b.commentCount;
        if (aScore !== bScore) return bScore - aScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('GET /api/community/posts:', error);
    return NextResponse.json(
      { success: false, posts: [], message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<CommunityPostResponse>> {
  try {
    const supabase = createClient();
    const auth = await requireCommunityActor(supabase);

    if (!auth.actor.user) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: auth.status }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = sanitizeCommunityText(body.title, 140);
    const content = sanitizeCommunityText(body.content, 12000);
    const tags = sanitizeTags(body.tags);
    const mediaType = normalizeMediaType(body.mediaType);
    const mediaUrl = sanitizeCommunityText(body.mediaUrl, 2048);
    const mediaPath = sanitizeCommunityText(body.mediaPath, 512);
    const mediaName = sanitizeCommunityText(body.mediaName, 160);

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required.' },
        { status: 400 }
      );
    }

    if (mediaUrl && !isHttpUrl(mediaUrl)) {
      return NextResponse.json(
        { success: false, message: 'Media URL must be a valid http(s) URL.' },
        { status: 400 }
      );
    }

    if (mediaUrl && !mediaType) {
      return NextResponse.json(
        { success: false, message: 'Media type is required when media is attached.' },
        { status: 400 }
      );
    }

    const { data: row, error } = await supabase
      .from('community_posts')
      .insert({
        title,
        content,
        tags,
        media_url: mediaUrl || null,
        media_path: mediaPath || null,
        media_type: mediaUrl ? mediaType : null,
        media_name: mediaName || null,
        author_id: auth.actor.user.id,
        author_name: auth.actor.displayName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating community post:', error);
      return NextResponse.json(
        {
          success: false,
          message: isCommunitySchemaMissingError(error)
            ? COMMUNITY_SETUP_REQUIRED_MESSAGE
            : 'Failed to create post.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, post: rowToCommunityPost(row, auth.actor, false) },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/community/posts:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
