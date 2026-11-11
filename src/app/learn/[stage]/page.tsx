import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStage } from '@/content/learn/stages';
import { getLearnerState, isStageOpen } from '@/lib/learn/access';
import { toClientQuestions } from '@/lib/learn/types';
import { reportProblemUrl } from '@/lib/learn/constants';
import { LearnShell, LearnUnavailable } from '@/components/learn/LearnShell';
import LockedNotice from '@/components/learn/LockedNotice';
import LessonMarkdown from '@/components/learn/LessonMarkdown';
import { WORD_CLASSES, hasOptionalDetails } from '@/components/learn/lessonHtml';
import WordPopover from '@/components/learn/WordPopover';
import DetailsToggle from '@/components/learn/DetailsToggle';
import { wordsForStage } from '@/content/learn/glossary';
import StackMap from '@/components/learn/StackMap';
import ConceptCheck from '@/components/learn/ConceptCheck';
import GithubUsernameForm from '@/components/learn/GithubUsernameForm';
import TickMemory from '@/components/learn/TickMemory';

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

  const hasCheck = stage.questions.length > 0;
  const stageWords = wordsForStage(stage.id);

  const lesson = (
    <>
      <StackMap highlight={stage.stackParts} />

      <div className="mt-4 flex items-start justify-between gap-4 text-xs text-gray-500">
        <p className="min-w-0">
          Words with a dotted underline show a plain definition when you tap them. Sections marked Optional open when
          you click them.
        </p>
        {hasOptionalDetails(stage.lesson) && <DetailsToggle targetId="lesson" />}
      </div>

      <div className="mt-6">
        <LessonMarkdown
          id="lesson"
          content={stage.lesson}
          replacements={{ githubUsername: username || 'your-username' }}
          skipHref={!passed && hasCheck ? '#concept-check' : undefined}
        />
      </div>

      {stageWords.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Words from this stage</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-800">
            {stageWords.map((entry) => (
              <li key={entry.word}>
                <span
                  data-word={entry.word}
                  data-definition={entry.definition}
                  role="button"
                  tabIndex={0}
                  className={WORD_CLASSES}
                >
                  {entry.word}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <LearnShell>
      {header}
      <WordPopover />

      {passed ? (
        // Once the check is passed, the build card is the work. The lesson folds away but stays one click off.
        <details className="group bg-white rounded-lg shadow-lg">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-6 sm:px-8 [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="text-blue-primary transition-transform group-open:rotate-90">
              &#9656;
            </span>
            <span>
              <span className="block text-lg font-semibold text-blue-primary">Lesson: {stage.title}</span>
              <span className="block text-sm text-gray-600">
                {hasCheck ? 'You passed this check.' : 'You have read this.'} Open the lesson to read it again.
              </span>
            </span>
          </summary>
          <div className="border-t border-gray-200 px-6 pb-6 pt-4 sm:px-8 sm:pb-8">{lesson}</div>
        </details>
      ) : (
        <article className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">{lesson}</article>
      )}

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

          <LessonMarkdown
            id="build-card"
            content={stage.build}
            replacements={{ githubUsername: username || 'your-username' }}
          />
          <TickMemory targetId="build-card" storageKey={`learn-ticks:${state.userId}:${stage.id}`} />

          {(stage.id === 2 || stage.id === 7) && (
            <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
              <GithubUsernameForm current={state.githubUsername} />
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/learn/words" className="text-blue-primary hover:underline">
              Words
            </Link>
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
