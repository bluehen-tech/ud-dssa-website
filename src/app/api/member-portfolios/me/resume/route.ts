import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const RESUME_BUCKET = 'member-resumes';
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function getExtension(fileName: string) {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/** POST /api/member-portfolios/me/resume - upload or replace resume for current user */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('resume');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'Missing resume file' }, { status: 400 });
    }

    if (!ALLOWED_RESUME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, message: 'Only PDF, DOC, or DOCX files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: 'Resume must be 5 MB or smaller' }, { status: 400 });
    }

    const ext = getExtension(file.name) || (file.type === 'application/pdf' ? 'pdf' : 'docx');
    const safeFileName = `resume.${ext}`;
    const storagePath = `${user.id}/${safeFileName}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, message: uploadError.message }, { status: 400 });
    }

    const { data: publicUrlData } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(storagePath);
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('member_portfolios')
      .update({
        resume_path: storagePath,
        resume_filename: file.name,
        resume_updated_at: nowIso,
        resume_mime: file.type,
        resume_size: file.size,
      })
      .eq('user_id', user.id)
      .in('status', ['draft', 'rejected'])
      .select('id')
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      resume_filename: file.name,
      resume_path: storagePath,
      resume_updated_at: nowIso,
      resume_mime: file.type,
      resume_size: file.size,
      resume_public_url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error('POST /api/member-portfolios/me/resume:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}

/** DELETE /api/member-portfolios/me/resume - remove current user's resume */
export async function DELETE() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: row } = await supabase
      .from('member_portfolios')
      .select('resume_path')
      .eq('user_id', user.id)
      .maybeSingle();

    const resumePath = row?.resume_path as string | undefined;
    if (resumePath) {
      try {
        await supabase.storage.from(RESUME_BUCKET).remove([resumePath]);
      } catch {
        // best effort delete from storage
      }
    }

    const { error: updateError } = await supabase
      .from('member_portfolios')
      .update({
        resume_path: null,
        resume_filename: null,
        resume_updated_at: null,
        resume_mime: null,
        resume_size: null,
      })
      .eq('user_id', user.id)
      .in('status', ['draft', 'rejected'])
      .select('id')
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/member-portfolios/me/resume:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
