import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getStage } from '@/content/learn/stages';
import { getLearnerState, isStageOpen } from '@/lib/learn/access';
import { scoreQuestions } from '@/lib/learn/types';

/**
 * POST /api/learn/[stage]/check
 * Body: { answers: { [questionId]: chosenText } }
 * Scores a concept check, logs the attempt, and records the pass.
 * The response names missed concepts, never the right answers.
 */
export async function POST(request: NextRequest, { params }: { params: { stage: string } }) {
  try {
    const stage = /^\d+$/.test(params.stage) ? getStage(Number(params.stage)) : undefined;
    if (!stage) {
      return NextResponse.json({ success: false, message: 'Unknown stage' }, { status: 404 });
    }

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
    if (!isStageOpen(stage.id, state.passed)) {
      return NextResponse.json(
        { success: false, message: `Pass Stage ${stage.id - 1} first.` },
        { status: 403 }
      );
    }

    let body: { answers?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      // An empty body is fine for Stage 0, which has no questions.
    }
    const answers =
      body.answers && typeof body.answers === 'object' ? (body.answers as Record<string, unknown>) : {};

    const score = scoreQuestions(stage.questions, answers);
    const admin = createAdminClient();

    const { error: attemptError } = await admin.from('learn_attempts').insert({
      user_id: state.userId,
      stage_id: stage.id,
      passed: score.passed,
      missed_question_ids: score.missedQuestionIds,
    });
    if (attemptError) {
      console.error('learn_attempts insert failed:', attemptError);
      return NextResponse.json({ success: false, message: 'Your answers could not be saved. Try again.' }, { status: 500 });
    }

    if (score.passed && !state.passed.has(stage.id)) {
      const { error: progressError } = await admin
        .from('learn_progress')
        .upsert({ user_id: state.userId, stage_id: stage.id }, { onConflict: 'user_id,stage_id', ignoreDuplicates: true });
      if (progressError) {
        console.error('learn_progress upsert failed:', progressError);
        return NextResponse.json({ success: false, message: 'Your pass could not be saved. Try again.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      passed: score.passed,
      missedConcepts: score.missedConcepts,
    });
  } catch (err) {
    console.error('POST /api/learn/[stage]/check:', err);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
  }
}
