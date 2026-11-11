import Link from 'next/link';
import { STAGES, COUNTED_STAGE_IDS, FINAL_STAGE_ID } from '@/content/learn/stages';
import { getLearnerState, isStageOpen, currentStageId } from '@/lib/learn/access';
import { tipUsernames } from '@/lib/learn/tips';
import { DSSA_REPO_URL } from '@/lib/learn/constants';
import { LearnShell, LearnUnavailable } from '@/components/learn/LearnShell';
import LockedNotice from '@/components/learn/LockedNotice';
import GithubUsernameForm from '@/components/learn/GithubUsernameForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Builder Path | DSSA @ UD' };

export default async function LearnPage() {
  const result = await getLearnerState();
  if (!result.ok) return <LearnUnavailable reason={result.reason} />;
  const { state } = result;

  const cleared = COUNTED_STAGE_IDS.filter((id) => state.passed.has(id)).length;
  const current = currentStageId(state.passed, STAGES.map((s) => s.id));
  const finished = state.passed.has(FINAL_STAGE_ID);
  const isContributor = Boolean(state.githubUsername && tipUsernames().has(state.githubUsername));

  return (
    <LearnShell>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-blue-primary mb-2">Builder Path</h1>
        <p className="text-xl text-gray-600">
          Learn how bluehen-dssa.org works by building a small site of your own. You do not need any coding
          experience. Each stage has a short lesson, a concept check, and a build card.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Builder Path {cleared} of {COUNTED_STAGE_IDS.length}
          {isContributor && ' · Contributor'}
        </p>
      </div>

      {state.missing.length > 0 ? (
        <LockedNotice missing={state.missing} />
      ) : (
        <>
          {finished && (
            <div className="bg-white p-8 rounded-lg shadow-lg border-l-4 border-gold">
              <h2 className="text-2xl font-bold text-blue-primary mb-2">You finished the Builder Path</h2>
              <p className="text-gray-700 mb-3">
                {isContributor
                  ? 'Your tip is on the DSSA site, and your member card shows Contributor.'
                  : 'Once your tip pull request merges, your member card shows Contributor.'}{' '}
                Here is what you can do next. Neither is required.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  Pick up an{' '}
                  <a
                    href={`${DSSA_REPO_URL}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-primary hover:underline"
                  >
                    open good first issue
                  </a>{' '}
                  on ud-dssa-website, when there are any.
                </li>
                <li>
                  Fix an unclear sentence in a lesson. Lessons are files in <code>src/content/learn/</code>. An officer
                  reviews these pull requests.
                </li>
              </ul>
            </div>
          )}

          <ol className="space-y-3">
            {STAGES.map((stage) => {
              const done = state.passed.has(stage.id);
              const open = isStageOpen(stage.id, state.passed);
              const isCurrent = stage.id === current;
              return (
                <li key={stage.id}>
                  <div
                    className={`bg-white p-5 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4 ${
                      isCurrent ? 'ring-2 ring-blue-primary' : ''
                    } ${open ? '' : 'opacity-60'}`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage {stage.id}</p>
                      <h2 className="text-lg font-semibold text-blue-primary">{stage.title}</h2>
                      <p className="text-sm text-gray-600">{stage.idea}</p>
                    </div>
                    {open ? (
                      <Link
                        href={`/learn/${stage.id}`}
                        className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          done
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-primary text-white hover:bg-blue-800'
                        }`}
                      >
                        {done ? 'Done. Review' : isCurrent ? 'Continue' : 'Open'}
                      </Link>
                    ) : (
                      <span className="shrink-0 text-sm text-gray-500">Opens after Stage {stage.id - 1}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            {state.passed.has(2) && <GithubUsernameForm current={state.githubUsername} />}
            <p className="text-sm text-gray-700">
              <Link href="/learn/words" className="font-medium text-blue-primary hover:underline">
                Words
              </Link>{' '}
              explains every technical word the path uses, in plain words.
            </p>
            <p className="text-sm text-gray-700">
              <Link href="/learn/tips" className="font-medium text-blue-primary hover:underline">
                Beginner Tips
              </Link>{' '}
              lists advice from members who finished the path.
            </p>
          </div>
        </>
      )}
    </LearnShell>
  );
}
