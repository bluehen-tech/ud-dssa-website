'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClientQuestion } from '@/lib/learn/types';

interface CheckResponse {
  success: boolean;
  passed?: boolean;
  missedConcepts?: string[];
  message?: string;
}

export default function ConceptCheck({
  stageId,
  questions,
}: {
  stageId: number;
  questions: ClientQuestion[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [missedConcepts, setMissedConcepts] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Passing swaps this check for the build card without leaving the page. This component is removed
  // at that moment, so that is when to bring the learner to the top, where the change is visible.
  const justPassed = useRef(false);
  useEffect(
    () => () => {
      if (justPassed.current) window.scrollTo(0, 0);
    },
    []
  );

  const isWelcome = questions.length === 0;
  const allAnswered = questions.every((q) => answers[q.id]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setMissedConcepts(null);
    try {
      const res = await fetch(`/api/learn/${stageId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data: CheckResponse = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'The check could not be saved. Try again.');
      if (data.passed) {
        justPassed.current = true;
        router.refresh();
        return;
      }
      setMissedConcepts(data.missedConcepts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The check could not be saved. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isWelcome) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Starting...' : 'Start the path'}
        </button>
      </div>
    );
  }

  return (
    <div id="concept-check" className="scroll-mt-24 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-primary mb-1">Concept check</h2>
      <p className="text-sm text-gray-600 mb-6">
        Answer every question correctly to unlock the build card. You can retake it as many times as you like.
      </p>

      <ol className="space-y-6">
        {questions.map((q, index) => (
          <li key={q.id}>
            <fieldset>
              <legend className="font-medium text-gray-900 mb-2">
                {index + 1}. {q.prompt}
              </legend>
              <div className="space-y-2">
                {q.choices.map((choice) => (
                  <label
                    key={choice}
                    className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      answers[q.id] === choice ? 'border-blue-primary bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={choice}
                      checked={answers[q.id] === choice}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-800 whitespace-pre-wrap">{choice}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {missedConcepts && (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4" role="status">
          <p className="font-medium text-amber-900 mb-1">Not yet. Reread these parts of the lesson, then try again:</p>
          <ul className="list-disc pl-5 text-sm text-amber-900">
            {missedConcepts.map((concept) => (
              <li key={concept}>{concept}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!allAnswered || submitting}
        className="mt-6 px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Checking...' : 'Check my answers'}
      </button>
    </div>
  );
}
