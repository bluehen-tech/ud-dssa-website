import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  COMMUNITY_SETUP_REQUIRED_MESSAGE,
  isCommunitySchemaMissingError,
  isUuid,
  requireCommunityActor,
} from '@/lib/community-server';
import type { CommunityVoteResponse } from '@/types/community';

type VoteTargetType = 'post' | 'comment';

function normalizeTargetType(value: unknown): VoteTargetType | null {
  return value === 'post' || value === 'comment' ? value : null;
}

async function getVoteCount(
  supabase: ReturnType<typeof createClient>,
  targetType: VoteTargetType,
  targetId: string
) {
  const table = targetType === 'post' ? 'community_posts' : 'community_comments';
  const { data } = await supabase.from(table).select('vote_count').eq('id', targetId).single();
  return Number((data as { vote_count?: number } | null)?.vote_count || 0);
}

export async function POST(request: NextRequest): Promise<NextResponse<CommunityVoteResponse>> {
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
    const targetType = normalizeTargetType(body.targetType);
    const targetId = typeof body.targetId === 'string' ? body.targetId : '';

    if (!targetType || !isUuid(targetId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid vote target.' },
        { status: 400 }
      );
    }

    const targetTable = targetType === 'post' ? 'community_posts' : 'community_comments';
    const targetColumn = targetType === 'post' ? 'post_id' : 'comment_id';
    const insertPayload =
      targetType === 'post'
        ? { user_id: auth.actor.user.id, post_id: targetId, comment_id: null }
        : { user_id: auth.actor.user.id, post_id: null, comment_id: targetId };

    const { data: target, error: targetError } = await supabase
      .from(targetTable)
      .select('id')
      .eq('id', targetId)
      .single();

    if (targetError && isCommunitySchemaMissingError(targetError)) {
      return NextResponse.json(
        { success: false, message: COMMUNITY_SETUP_REQUIRED_MESSAGE },
        { status: 500 }
      );
    }

    if (!target) {
      return NextResponse.json(
        { success: false, message: 'Vote target not found.' },
        { status: 404 }
      );
    }

    const { data: existingVote, error: existingVoteError } = await supabase
      .from('community_votes')
      .select('id')
      .eq('user_id', auth.actor.user.id)
      .eq(targetColumn, targetId)
      .maybeSingle();

    if (existingVoteError && isCommunitySchemaMissingError(existingVoteError)) {
      return NextResponse.json(
        { success: false, message: COMMUNITY_SETUP_REQUIRED_MESSAGE },
        { status: 500 }
      );
    }

    if (existingVote) {
      const { error } = await supabase
        .from('community_votes')
        .delete()
        .eq('id', (existingVote as { id: string }).id);

      if (error) {
        console.error('Error removing community vote:', error);
        return NextResponse.json(
          {
            success: false,
            message: isCommunitySchemaMissingError(error)
              ? COMMUNITY_SETUP_REQUIRED_MESSAGE
              : 'Failed to update vote.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        voted: false,
        voteCount: await getVoteCount(supabase, targetType, targetId),
      });
    }

    const { error } = await supabase.from('community_votes').insert(insertPayload);

    if (error) {
      console.error('Error creating community vote:', error);
      return NextResponse.json(
        {
          success: false,
          message: isCommunitySchemaMissingError(error)
            ? COMMUNITY_SETUP_REQUIRED_MESSAGE
            : 'Failed to update vote.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      voted: true,
      voteCount: await getVoteCount(supabase, targetType, targetId),
    });
  } catch (error) {
    console.error('POST /api/community/votes:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
