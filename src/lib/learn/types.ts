/**
 * Builder Path question and stage types. The question shape follows the item
 * pattern from the Good Decisions course platform: each question carries a
 * concept label, and feedback names the concept to reread, never the answer.
 * Answers live in the repo and are not secret; the path is not for credit.
 */

export type StackPart = 'cursor' | 'github' | 'nextjs' | 'vercel' | 'supabase' | 'resend';

export interface Question {
  id: string;
  /** Named in feedback when the question is missed. */
  concept: string;
  prompt: string;
  answer: string;
  wrong: string[];
}

export interface Stage {
  id: number;
  title: string;
  /** One-line statement of the stage's idea, shown on the path map. */
  idea: string;
  stackParts: StackPart[];
  /** Date an officer last walked through the build card (YYYY-MM-DD). */
  lastChecked: string;
  lesson: string;
  build: string;
  questions: Question[];
}

/** What the browser receives: choices only, no answer. */
export interface ClientQuestion {
  id: string;
  prompt: string;
  choices: string[];
}

export interface CheckResult {
  passed: boolean;
  missedConcepts: string[];
  missedQuestionIds: string[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function toClientQuestions(questions: Question[]): ClientQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: shuffle([q.answer, ...q.wrong]),
  }));
}

/** Every question must be answered correctly to pass. Choices are compared by text, so shuffling is safe. */
export function scoreQuestions(questions: Question[], answers: Record<string, unknown>): CheckResult {
  const missed = questions.filter((q) => answers[q.id] !== q.answer);
  return {
    passed: missed.length === 0,
    missedConcepts: Array.from(new Set(missed.map((q) => q.concept))),
    missedQuestionIds: missed.map((q) => q.id),
  };
}
