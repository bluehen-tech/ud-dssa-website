import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  COMMUNITY_MEDIA_BUCKET,
  getOptionalCommunityActor,
  isUuid,
  requireCommunityActor,
  rowToCommunityPost,
} from '@/lib/community-server';
import type { CommunityPostResponse } from '@/types/community';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<CommunityPostResponse>> {
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

    if (!auth.actor.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required.' },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const isPinned = body.isPinned === true;

    const { data: row, error } = await supabase
      .from('community_posts')
      .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating community post:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update post.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post: rowToCommunityPost(row, auth.actor, false),
    });
  } catch (error) {
    console.error('PATCH /api/community/posts/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<{ success: boolean; message?: string }>> {
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

    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('author_id, media_path')
      .eq('id', params.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ success: false, message: 'Post not found.' }, { status: 404 });
    }

    const canDelete = auth.actor.isAdmin || (post as { author_id: string }).author_id === auth.actor.user.id;
    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to delete this post.' },
        { status: 403 }
      );
    }

    const mediaPath = (post as { media_path?: string | null }).media_path;
    if (mediaPath) {
      await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove([mediaPath]).catch(() => {
        // Storage cleanup is best effort; the database delete is the source of truth.
      });
    }

    const { error } = await supabase.from('community_posts').delete().eq('id', params.id);

    if (error) {
      console.error('Error deleting community post:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete post.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/community/posts/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
