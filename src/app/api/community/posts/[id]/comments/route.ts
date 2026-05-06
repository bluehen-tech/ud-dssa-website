import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  COMMUNITY_SETUP_REQUIRED_MESSAGE,
  getOptionalCommunityActor,
  isCommunitySchemaMissingError,
  isUuid,
  requireCommunityActor,
  rowToCommunityComment,
  sanitizeCommunityText,
} from '@/lib/community-server';
import type {
  CommunityCommentResponse,
  CommunityCommentsResponse,
} from '@/types/community';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<CommunityCommentsResponse>> {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json(
        { success: false, comments: [], message: 'Invalid post id.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const actor = await getOptionalCommunityActor(supabase);

    const { data: rows, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching community comments:', error);
      return NextResponse.json(
        {
          success: false,
          comments: [],
          message: isCommunitySchemaMissingError(error)
            ? COMMUNITY_SETUP_REQUIRED_MESSAGE
            : 'Failed to load comments.',
        },
        { status: 500 }
      );
    }

    const commentIds = (rows || []).map((row: any) => row.id);
    const votedCommentIds = new Set<string>();

    if (actor.user && commentIds.length > 0) {
      const { data: votes } = await supabase
        .from('community_votes')
        .select('comment_id')
        .eq('user_id', actor.user.id)
        .in('comment_id', commentIds);

      for (const vote of votes || []) {
        if ((vote as { comment_id?: string }).comment_id) {
          votedCommentIds.add((vote as { comment_id: string }).comment_id);
        }
      }
    }

    const comments = (rows || []).map((row: any) =>
      rowToCommunityComment(row, actor, votedCommentIds.has(row.id))
    );

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('GET /api/community/posts/[id]/comments:', error);
    return NextResponse.json(
      { success: false, comments: [], message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<CommunityCommentResponse>> {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ success: false, message: 'Invalid post id.' }, { status: 400 });
    }

    const supabase = createClient();
    const auth = await requireCommunityActor(supabase);

    if (!auth.actor.user) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: auth.status }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const content = sanitizeCommunityText(body.content, 6000);
    const parentId =
      typeof body.parentId === 'string' && isUuid(body.parentId) ? body.parentId : null;

    if (!content) {
      return NextResponse.json(
        { success: false, message: 'Comment cannot be empty.' },
        { status: 400 }
      );
    }

    const { data: post } = await supabase
      .from('community_posts')
      .select('id')
      .eq('id', params.id)
      .single();

    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    if (parentId) {
      const { data: parent } = await supabase
        .from('community_comments')
        .select('id')
        .eq('id', parentId)
        .eq('post_id', params.id)
        .single();

      if (!parent) {
        return NextResponse.json(
          { success: false, message: 'Parent comment not found.' },
          { status: 404 }
        );
      }
    }

    const { data: row, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: params.id,
        parent_id: parentId,
        content,
        author_id: auth.actor.user.id,
        author_name: auth.actor.displayName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating community comment:', error);
      return NextResponse.json(
        {
          success: false,
          message: isCommunitySchemaMissingError(error)
            ? COMMUNITY_SETUP_REQUIRED_MESSAGE
            : 'Failed to add comment.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, comment: rowToCommunityComment(row, auth.actor, false) },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/community/posts/[id]/comments:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
