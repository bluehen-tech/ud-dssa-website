import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isUuid, requireCommunityActor, sanitizeCommunityText } from '@/lib/community-server';

type ReportTargetType = 'post' | 'comment';

function normalizeTargetType(value: unknown): ReportTargetType | null {
  return value === 'post' || value === 'comment' ? value : null;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; message?: string }>> {
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
    const reason = sanitizeCommunityText(body.reason, 500);

    if (!targetType || !isUuid(targetId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid report target.' },
        { status: 400 }
      );
    }

    const targetTable = targetType === 'post' ? 'community_posts' : 'community_comments';
    const targetColumn = targetType === 'post' ? 'post_id' : 'comment_id';

    const { data: target } = await supabase.from(targetTable).select('id').eq('id', targetId).single();
    if (!target) {
      return NextResponse.json(
        { success: false, message: 'Report target not found.' },
        { status: 404 }
      );
    }

    const { error } = await supabase.from('community_reports').insert({
      reporter_id: auth.actor.user.id,
      target_type: targetType,
      [targetColumn]: targetId,
      reason: reason || null,
    });

    if (error) {
      console.error('Error creating community report:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to submit report.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/community/reports:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
