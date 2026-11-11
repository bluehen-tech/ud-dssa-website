import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { GITHUB_USERNAME_PATTERN } from '@/lib/learn/constants';

function secretMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/learn/tips/merged
 * Header: Authorization: Bearer <TIPS_WEBHOOK_SECRET>
 * Body: { username }
 * Called by the merge-tip workflow after it merges a tip. Records the merge
 * time so the Beginner Tips page can list the newest tips first.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.TIPS_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json({ success: false, message: 'TIPS_WEBHOOK_SECRET is not set' }, { status: 503 });
  }

  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!secretMatches(given, expected)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let body: { username?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!GITHUB_USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ success: false, message: 'Invalid username' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('learn_profiles')
    .update({ tip_merged_at: new Date().toISOString() })
    .eq('github_username', username)
    .select('user_id');
  if (error) {
    console.error('POST /api/learn/tips/merged:', error);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: data?.length ?? 0 });
}
