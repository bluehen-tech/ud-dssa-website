import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isUuid, requireCommunityActor } from '@/lib/community-server';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<{ success: boolean; message?: string }>> {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ success: false, message: 'Invalid comment id.' }, { status: 400 });
    }

    const supabase = createClient();
    const auth = await requireCommunityActor(supabase);

    if (!auth.actor.user) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: auth.status }
      );
    }

    const { data: comment, error: fetchError } = await supabase
      .from('community_comments')
      .select('author_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ success: false, message: 'Comment not found.' }, { status: 404 });
    }

    const canDelete =
      auth.actor.isAdmin || (comment as { author_id: string }).author_id === auth.actor.user.id;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to delete this comment.' },
        { status: 403 }
      );
    }

    const { error } = await supabase.from('community_comments').delete().eq('id', params.id);

    if (error) {
      console.error('Error deleting community comment:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete comment.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/community/comments/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
