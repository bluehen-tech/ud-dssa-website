import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getLearnerState } from '@/lib/learn/access';
import { GITHUB_USERNAME_PATTERN } from '@/lib/learn/constants';

/**
 * POST /api/learn/github-username
 * Body: { username }
 * Saves the learner's GitHub username after confirming it exists on GitHub.
 * Stored lowercase; GitHub usernames are not case-sensitive.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await getLearnerState();
    if (!result.ok) {
      return NextResponse.json({ success: false, message: 'Sign in to continue.' }, { status: 401 });
    }
    const { state } = result;
    if (state.missing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Publish your portfolio with a photo to open the path.' },
        { status: 403 }
      );
    }

    let body: { username?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    const username = typeof body.username === 'string' ? body.username.trim().replace(/^@/, '').toLowerCase() : '';
    if (!GITHUB_USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        { success: false, message: 'That is not a valid GitHub username. Use letters, numbers and hyphens only.' },
        { status: 400 }
      );
    }

    const githubRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'bluehen-dssa-builder-path' },
      cache: 'no-store',
    });
    if (githubRes.status === 404) {
      return NextResponse.json(
        { success: false, message: `There is no GitHub account named "${username}". Check the spelling.` },
        { status: 400 }
      );
    }
    if (!githubRes.ok) {
      return NextResponse.json(
        { success: false, message: 'GitHub did not answer. Wait a minute and try again.' },
        { status: 502 }
      );
    }

    const admin = createAdminClient();
    const { data: taken } = await admin
      .from('learn_profiles')
      .select('user_id')
      .eq('github_username', username)
      .neq('user_id', state.userId)
      .maybeSingle();
    if (taken) {
      return NextResponse.json(
        { success: false, message: 'Another member already saved that username. Ask an officer if it is yours.' },
        { status: 409 }
      );
    }

    const { error } = await admin
      .from('learn_profiles')
      .upsert(
        { user_id: state.userId, github_username: username, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    if (error) {
      console.error('learn_profiles upsert failed:', error);
      return NextResponse.json({ success: false, message: 'Could not save your username. Try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, username });
  } catch (err) {
    console.error('POST /api/learn/github-username:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
