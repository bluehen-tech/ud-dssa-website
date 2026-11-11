import type { Stage } from '@/lib/learn/types';

import stage0Lesson from './stage-0/lesson.md';
import stage0Build from './stage-0/build.md';
import stage1Lesson from './stage-1/lesson.md';
import stage1Build from './stage-1/build.md';
import stage2Lesson from './stage-2/lesson.md';
import stage2Build from './stage-2/build.md';
import stage3Lesson from './stage-3/lesson.md';
import stage3Build from './stage-3/build.md';
import stage4Lesson from './stage-4/lesson.md';
import stage4Build from './stage-4/build.md';
import stage5Lesson from './stage-5/lesson.md';
import stage5Build from './stage-5/build.md';
import stage6Lesson from './stage-6/lesson.md';
import stage6Build from './stage-6/build.md';
import stage7Lesson from './stage-7/lesson.md';
import stage7Build from './stage-7/build.md';

import { stage1Questions } from './stage-1/questions';
import { stage2Questions } from './stage-2/questions';
import { stage3Questions } from './stage-3/questions';
import { stage4Questions } from './stage-4/questions';
import { stage5Questions } from './stage-5/questions';
import { stage6Questions } from './stage-6/questions';
import { stage7Questions } from './stage-7/questions';

/**
 * The Builder Path. Lessons and build cards are markdown files in each stage
 * folder; questions are in questions.ts. Follow VOICE.md when editing, and
 * update lastChecked after you walk through a build card yourself.
 */
export const STAGES: Stage[] = [
  {
    id: 0,
    title: 'You are already on the site',
    idea: 'Your portfolio went online through six tools working together.',
    stackParts: ['cursor', 'github', 'nextjs', 'vercel', 'supabase', 'resend'],
    lastChecked: '2026-11-11',
    lesson: stage0Lesson,
    build: stage0Build,
    questions: [],
  },
  {
    id: 1,
    title: 'Your toolkit',
    idea: 'Cursor is an editor with an AI agent built in. The terminal runs typed commands.',
    stackParts: ['cursor'],
    lastChecked: '2026-11-11',
    lesson: stage1Lesson,
    build: stage1Build,
    questions: stage1Questions,
  },
  {
    id: 2,
    title: 'Git and GitHub',
    idea: 'A commit saves your files. A diff shows what changed. Secrets are never committed.',
    stackParts: ['github'],
    lastChecked: '2026-11-11',
    lesson: stage2Lesson,
    build: stage2Build,
    questions: stage2Questions,
  },
  {
    id: 3,
    title: 'Going live',
    idea: 'Your laptop has one copy and the web has the live copy. A push updates the live copy.',
    stackParts: ['vercel'],
    lastChecked: '2026-11-11',
    lesson: stage3Lesson,
    build: stage3Build,
    questions: stage3Questions,
  },
  {
    id: 4,
    title: 'Pages and components',
    idea: 'Each page.tsx file in app/ is a page. A component is a piece you reuse.',
    stackParts: ['nextjs'],
    lastChecked: '2026-11-11',
    lesson: stage4Lesson,
    build: stage4Build,
    questions: stage4Questions,
  },
  {
    id: 5,
    title: 'Data',
    idea: 'A table holds rows. An API route writes them. Keys stay in environment variables.',
    stackParts: ['supabase'],
    lastChecked: '2026-11-11',
    lesson: stage5Lesson,
    build: stage5Build,
    questions: stage5Questions,
  },
  {
    id: 6,
    title: 'Guided tours',
    idea: 'Read how the DSSA site handles sign-in, security, files and email.',
    stackParts: ['supabase', 'resend'],
    lastChecked: '2026-11-11',
    lesson: stage6Lesson,
    build: stage6Build,
    questions: stage6Questions,
  },
  {
    id: 7,
    title: 'Your first pull request',
    idea: 'Fork, branch, pull request, automated checks. Your tip goes on the DSSA site.',
    stackParts: ['github'],
    lastChecked: '2026-11-11',
    lesson: stage7Lesson,
    build: stage7Build,
    questions: stage7Questions,
  },
];

/** Stages that count toward the badge ("Builder Path 3 of 7"). Stage 0 is the welcome. */
export const COUNTED_STAGE_IDS = STAGES.filter((s) => s.id > 0).map((s) => s.id);
export const FINAL_STAGE_ID = STAGES[STAGES.length - 1].id;

export function getStage(id: number): Stage | undefined {
  return STAGES.find((s) => s.id === id);
}

export function findQuestion(questionId: string) {
  for (const stage of STAGES) {
    const question = stage.questions.find((q) => q.id === questionId);
    if (question) return { stage, question };
  }
  return undefined;
}
