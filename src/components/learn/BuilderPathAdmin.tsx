'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface StageCount {
  stageId: number;
  title: string;
  lastChecked: string;
  learners: number;
}

interface Learner {
  userId: string;
  name: string | null;
  portfolioId: string | null;
  email: string | null;
  githubUsername: string | null;
  tipsBlocked: boolean;
  currentStage: number | null;
  finished: boolean;
  lastActivity: string | null;
}

interface MissedQuestion {
  questionId: string;
  misses: number;
  stageId: number | null;
  prompt: string;
  concept: string | null;
}

interface Tip {
  username: string;
  tip: string;
  fileUrl: string;
  mergedAt: string | null;
  authorName: string | null;
}

interface Overview {
  stageCounts: StageCount[];
  finishedCount: number;
  learners: Learner[];
  mostMissed: MissedQuestion[];
  recentTips: Tip[];
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BuilderPathAdmin({ onToast }: { onToast: (message: string, type: 'success' | 'error') => void }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/builder-path');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load the Builder Path overview');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the Builder Path overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBlock = async (learner: Learner) => {
    const next = !learner.tipsBlocked;
    const label = learner.name || learner.email || learner.githubUsername || 'this learner';
    const ok = window.confirm(
      next
        ? `Block tips from ${label}? Their tip pull requests will stop merging automatically and wait for an officer.`
        : `Allow tips from ${label} again?`
    );
    if (!ok) return;

    setUpdating(learner.userId);
    try {
      const res = await fetch('/api/admin/builder-path', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: learner.userId, tips_blocked: next }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Update failed');
      setData((prev) =>
        prev
          ? {
              ...prev,
              learners: prev.learners.map((l) => (l.userId === learner.userId ? { ...l, tipsBlocked: next } : l)),
            }
          : prev
      );
      onToast(json.message, 'success');
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Update failed', 'error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <section className="mt-10 space-y-6" aria-labelledby="builder-path-admin">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 id="builder-path-admin" className="text-3xl font-bold text-blue-primary mb-2">
          Builder Path
        </h2>
        <p className="text-gray-600">
          Progress on the beginner path at{' '}
          <Link href="/learn" className="text-blue-primary hover:underline">
            /learn
          </Link>
          . Officers have no required step. See <code>docs/BUILDER_PATH.md</code> for how to edit a lesson, remove a
          tip or block a learner.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={load} className="text-sm font-medium text-red-700 hover:text-red-900 underline">
            Retry
          </button>
        </div>
      )}

      {loading && !data && <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">Loading...</div>}

      {data && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learners at each stage</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.stageCounts.map((s) => (
                <div key={s.stageId} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage {s.stageId}</p>
                  <p className="text-sm font-medium text-gray-800 truncate" title={s.title}>
                    {s.title}
                  </p>
                  <p className="text-2xl font-bold text-blue-primary">{s.learners}</p>
                  <p className="text-[11px] text-gray-400">Steps checked {s.lastChecked}</p>
                </div>
              ))}
              <div className="rounded-lg border border-gold bg-gold/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Finished</p>
                <p className="text-sm font-medium text-gray-800">All stages</p>
                <p className="text-2xl font-bold text-blue-primary">{data.finishedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 px-6 pt-6 pb-3">Learners</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Member', 'Stage', 'Last activity', 'GitHub', 'Tips'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.learners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No one has started the path yet.
                    </td>
                  </tr>
                ) : (
                  data.learners.map((l) => (
                    <tr key={l.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">
                        {l.portfolioId ? (
                          <Link href={`/members/${l.portfolioId}`} className="font-medium text-blue-primary hover:underline">
                            {l.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-900">{l.name || 'No portfolio'}</span>
                        )}
                        <div className="text-xs text-gray-500">{l.email}</div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {l.finished ? 'Finished' : `Stage ${l.currentStage}`}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(l.lastActivity)}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {l.githubUsername ? (
                          <a
                            href={`https://github.com/${l.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {l.githubUsername}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleBlock(l)}
                          disabled={updating === l.userId}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                            l.tipsBlocked
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {l.tipsBlocked ? 'Blocked. Allow' : 'Allowed. Block'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Most-missed questions</h3>
              <p className="text-sm text-gray-500 mb-4">A question near the top may mean its lesson needs rewriting.</p>
              {data.mostMissed.length === 0 ? (
                <p className="text-sm text-gray-500">No missed questions yet.</p>
              ) : (
                <ol className="space-y-3">
                  {data.mostMissed.map((q) => (
                    <li key={q.questionId} className="text-sm">
                      <p className="text-gray-800">
                        <span className="font-semibold text-blue-primary">{q.misses}×</span> Stage {q.stageId ?? '?'}:{' '}
                        {q.prompt}
                      </p>
                      {q.concept && <p className="text-xs text-gray-500">Lesson section: {q.concept}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Recent tips</h3>
              <p className="text-sm text-gray-500 mb-4">
                To remove a tip, delete its file on GitHub. It is gone after the next deploy.
              </p>
              {data.recentTips.length === 0 ? (
                <p className="text-sm text-gray-500">No tips yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recentTips.map((t) => (
                    <li key={t.username} className="text-sm">
                      <p className="text-gray-800">{t.tip}</p>
                      <p className="text-xs text-gray-500">
                        {t.authorName || `@${t.username}`} · {formatDate(t.mergedAt)} ·{' '}
                        <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-primary hover:underline">
                          File on GitHub
                        </a>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
