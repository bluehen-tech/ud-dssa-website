import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  COMMUNITY_MEDIA_BUCKET,
  requireCommunityActor,
  sanitizeCommunityText,
} from '@/lib/community-server';
import type { CommunityMediaResponse, CommunityMediaType } from '@/types/community';

const MAX_MEDIA_SIZE = 25 * 1024 * 1024;

const ALLOWED_MEDIA_TYPES: Record<string, CommunityMediaType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'video/mp4': 'video',
};

function safeFileName(name: string) {
  const fallback = `community-${Date.now()}`;
  const trimmed = sanitizeCommunityText(name, 120) || fallback;
  return trimmed
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120) || fallback;
}

export async function POST(request: NextRequest): Promise<NextResponse<CommunityMediaResponse>> {
  try {
    const supabase = createClient();
    const auth = await requireCommunityActor(supabase);

    if (!auth.actor.user) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: auth.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'Choose an image or MP4 file to upload.' },
        { status: 400 }
      );
    }

    const mediaType = ALLOWED_MEDIA_TYPES[file.type];
    if (!mediaType) {
      return NextResponse.json(
        { success: false, message: 'Only JPEG, PNG, and MP4 media are supported.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_MEDIA_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Media must be 25MB or smaller.' },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${safeFileName(file.name)}`;
    const storagePath = `${auth.actor.user.id}/${fileName}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(COMMUNITY_MEDIA_BUCKET)
      .upload(storagePath, bytes, {
        cacheControl: '86400',
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading community media:', uploadError);
      return NextResponse.json(
        {
          success: false,
          message:
            uploadError.message?.toLowerCase().includes('bucket')
              ? `Storage bucket '${COMMUNITY_MEDIA_BUCKET}' is not configured.`
              : 'Failed to upload media.',
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(COMMUNITY_MEDIA_BUCKET).getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      mediaUrl: data.publicUrl,
      mediaPath: storagePath,
      mediaType,
      mediaName: file.name,
    });
  } catch (error) {
    console.error('POST /api/community/media:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
