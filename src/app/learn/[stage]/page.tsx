import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStage } from '@/content/learn/stages';
import { getLearnerState, isStageOpen } from '@/lib/learn/access';
import { toClientQuestions } from '@/lib/learn/types';
import { reportProblemUrl } from '@/lib/learn/constants';
import { LearnShell, LearnUnavailable } from '@/components/learn/LearnShell';
import LockedNotice from '@/components/learn/LockedNotice';
import LessonMarkdown from '@/components/learn/LessonMarkdown';
import StackMap from '@/components/learn/StackMap';
import ConceptCheck from '@/components/learn/ConceptCheck';
import GithubUsernameForm from '@/components/learn/GithubUsernameForm';

export const dynamic = 'force-dynamic';

export default async function StagePage({ params }: { params: { stage: string } }) {
  const stageId = /^\d+$/.test(params.stage) ? Number(params.stage) : NaN;
  const stage = Number.isNaN(stageId) ? undefined : getStage(stageId);
  if (!stage) notFound();

  const result = await getLearnerState();
  if (!result.ok) return <LearnUnavailable reason={result.reason} />;
  const { state } = result;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <Link href="/learn" className="text-blue-primary hover:underline">
        ← Path map
      </Link>
      <span className="text-gray-500">Stage {stage.id} of 7</span>
    </div>
  );

  if (state.missing.length > 0) {
    return (
      <LearnShell>
        {header}
        <LockedNotice missing={state.missing} />
      </LearnShell>
    );
  }

  if (!isStageOpen(stage.id, state.passed)) {
    return (
      <LearnShell>
        {header}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-blue-primary mb-2">Stage {stage.id} is not open yet</h1>
          <p className="text-gray-700 mb-4">Pass the concept check in Stage {stage.id - 1} first.</p>
          <Link href={`/learn/${stage.id - 1}`} className="text-blue-primary font-medium hover:underline">
            Go to Stage {stage.id - 1}
          </Link>
        </div>
      </LearnShell>
    );
  }

  const passed = state.passed.has(stage.id);
  const username = state.githubUsername ?? '';
  const nextStage = getStage(stage.id + 1);

  return (
    <LearnShell>
      {header}

      <article className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
        <StackMap highlight={stage.stackParts} />
        <div className="mt-6">
          <LessonMarkdown content={stage.lesson} replacements={{ githubUsername: username || 'your-username' }} />
        </div>
      </article>

      {!passed && <ConceptCheck stageId={stage.id} questions={toClientQuestions(stage.questions)} />}

      {passed && (
        <section className="bg-white p-6 sm:p-8 rounded-lg shadow-lg border-t-4 border-blue-primary">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-4">
            {stage.questions.length > 0 ? 'Check passed. Build card unlocked.' : 'Build card'}
          </p>

          {stage.id === 7 && !username && (
            <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Save your GitHub username first. The steps below use it, and the tip check matches your file name
              against it.
            </div>
          )}

          <LessonMarkdown content={stage.build} replacements={{ githubUsername: username || 'your-username' }} />

          {(stage.id === 2 || stage.id === 7) && (
            <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
              <GithubUsernameForm current={state.githubUsername} />
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/learn/tips" className="text-blue-primary hover:underline">
              Beginner Tips
            </Link>
            <Link href="/community" className="text-blue-primary hover:underline">
              Questions? Ask on DataTalk
            </Link>
            <a
              href={reportProblemUrl(stage.id, stage.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-primary hover:underline"
            >
              Report a problem with this step
            </a>
            <span className="text-gray-400">Steps last checked {stage.lastChecked}</span>
          </div>

          {nextStage && (
            <div className="mt-6">
              <Link
                href={`/learn/${nextStage.id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
              >
                Next: Stage {nextStage.id}, {nextStage.title}
              </Link>
            </div>
          )}
        </section>
      )}
    </LearnShell>
  );
}
