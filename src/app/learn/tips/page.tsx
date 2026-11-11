import Link from 'next/link';
import { getLearnerState } from '@/lib/learn/access';
import { loadTipsWithAuthors } from '@/lib/learn/tip-authors';
import { LearnShell, LearnUnavailable } from '@/components/learn/LearnShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Beginner Tips | DSSA @ UD' };

export default async function BeginnerTipsPage() {
  const result = await getLearnerState();
  if (!result.ok) return <LearnUnavailable reason={result.reason} />;

  const tips = await loadTipsWithAuthors();

  return (
    <LearnShell>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href="/learn" className="text-blue-primary hover:underline">
          ← Path map
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-blue-primary mb-2">Beginner Tips</h1>
        <p className="text-xl text-gray-600">
          Advice from members who finished the Builder Path. Each tip was added with a pull request in Stage 7.
        </p>
      </div>

      {tips.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-600">
          No tips yet. The first member to finish Stage 7 adds the first one.
        </div>
      ) : (
        <ul className="space-y-3">
          {tips.map((tip) => (
            <li key={tip.username} className="bg-white p-5 rounded-lg shadow-md">
              <p className="text-gray-800 text-lg leading-relaxed">{tip.tip}</p>
              <p className="mt-2 text-sm text-gray-500">
                {tip.portfolioId ? (
                  <Link href={`/members/${tip.portfolioId}`} className="font-medium text-blue-primary hover:underline">
                    {tip.authorName}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-700">@{tip.username}</span>
                )}
                {tip.mergedAt && (
                  <>
                    {' · '}
                    {new Date(tip.mergedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </LearnShell>
  );
}
