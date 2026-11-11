import Link from 'next/link';
import { STAGES } from '@/content/learn/stages';
import { wordsForStage } from '@/content/learn/glossary';
import { getLearnerState } from '@/lib/learn/access';
import { LearnShell, LearnUnavailable } from '@/components/learn/LearnShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Words | Builder Path | DSSA @ UD' };

export default async function WordsPage() {
  const result = await getLearnerState();
  if (!result.ok) return <LearnUnavailable reason={result.reason} />;

  return (
    <LearnShell>
      <Link href="/learn" className="text-sm text-blue-primary hover:underline">
        ← Path map
      </Link>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-blue-primary mb-2">Words</h1>
        <p className="text-lg text-gray-600">
          Every technical word the Builder Path uses, in plain words. They are listed by the stage that teaches them.
          You do not need to learn them ahead of time.
        </p>
      </div>

      {STAGES.map((stage) => {
        const words = wordsForStage(stage.id);
        if (words.length === 0) return null;
        return (
          <section key={stage.id} className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage {stage.id}</p>
            <h2 className="text-lg font-semibold text-blue-primary mb-3">{stage.title}</h2>
            <dl className="divide-y divide-gray-100">
              {words.map((entry) => (
                <div key={entry.word} className="py-2 sm:grid sm:grid-cols-4 sm:gap-4">
                  <dt className="font-medium text-gray-900">{entry.word}</dt>
                  <dd className="text-gray-700 sm:col-span-3">{entry.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </LearnShell>
  );
}
