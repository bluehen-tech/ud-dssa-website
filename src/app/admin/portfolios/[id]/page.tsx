'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { MemberPortfolio } from '@/types/member';

interface AdminPortfolioResponse {
  success: boolean;
  message?: string;
  portfolio?: MemberPortfolio;
  status?: string;
  submitted_at?: string | null;
  rejection_reason?: string | null;
}

const REJECTION_TEMPLATES = [
  'Please expand your bio with clearer details about your interests and goals.',
  'Please add at least one complete experience or project entry with meaningful descriptions.',
  'One or more links appear invalid or incomplete. Please update your links and resubmit.',
  'Please improve formatting and clarity (skills, achievements, and role details).',
];

export default function AdminPortfolioReviewPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { session, isAdmin, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<MemberPortfolio | null>(null);
  const [status, setStatus] = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [existingRejectionReason, setExistingRejectionReason] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace('/login?redirect=/admin/portfolios');
      return;
    }
    if (!isAdmin) {
      router.replace('/');
      return;
    }
    if (!id) return;
    fetchPortfolio(id);
  }, [authLoading, session, isAdmin, id, router]);

  const fetchPortfolio = async (portfolioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/member-portfolios/${portfolioId}`);
      const data: AdminPortfolioResponse = await res.json();
      if (!res.ok || !data.success || !data.portfolio) {
        throw new Error(data.message || 'Failed to load portfolio');
      }

      setPortfolio(data.portfolio);
      setStatus(data.status || '');
      setSubmittedAt(data.submitted_at || null);
      setExistingRejectionReason(data.rejection_reason || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/member-portfolios/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve');
      router.push('/admin/portfolios');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError('Rejection reason is required.');
      return;
    }

    setRejecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/member-portfolios/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject');
      router.push('/admin/portfolios');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const headline = useMemo(() => {
    if (!portfolio) return 'Portfolio Review';
    return `${portfolio.name} — Portfolio Review`;
  }, [portfolio]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  if (error && !portfolio) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-blue-primary">Portfolio Review</h1>
            <Link href="/admin/portfolios" className="text-blue-primary hover:underline text-sm">← Back to pending list</Link>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-primary">{headline}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Status: <span className="font-medium capitalize">{status || 'unknown'}</span>
              {submittedAt ? ` • Submitted ${new Date(submittedAt).toLocaleString()}` : ''}
            </p>
          </div>
          <Link href="/admin/portfolios" className="text-blue-primary hover:underline text-sm">← Back to pending list</Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {existingRejectionReason && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-medium text-amber-900">Previous rejection reason</p>
            <p className="text-sm text-amber-800 mt-1">{existingRejectionReason}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Basic Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <p><span className="font-medium">Name:</span> {portfolio.name || '—'}</p>
              <p><span className="font-medium">Role:</span> {portfolio.role || '—'}</p>
              <p><span className="font-medium">Position:</span> {portfolio.position || '—'}</p>
              <p><span className="font-medium">Tagline:</span> {portfolio.tagline || '—'}</p>
              <p><span className="font-medium">Major:</span> {portfolio.major || '—'}</p>
              <p><span className="font-medium">Graduation:</span> {portfolio.graduationDate || '—'}</p>
            </div>
            {portfolio.bio && <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{portfolio.bio}</p>}
          </section>

          {portfolio.skills && portfolio.skills.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {portfolio.skills.flatMap((group, groupIndex) =>
                  (group.items || []).map((skill, skillIndex) => (
                    <span key={`${groupIndex}-${skillIndex}`} className="px-2 py-1 rounded-full bg-gray-100 text-sm text-gray-800">
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </section>
          )}

          {portfolio.education && portfolio.education.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Education</h2>
              <div className="space-y-3">
                {portfolio.education.map((item, index) => (
                  <div key={`${item.degree}-${index}`} className="border border-gray-200 rounded-md p-3">
                    <p className="font-medium text-gray-900">{item.degree} — {item.institution}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {[item.fieldOfStudy, item.location, item.startYear ? String(item.startYear) : '', item.endYear ? `- ${item.endYear}` : '']
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                    {item.honors && item.honors.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                        {item.honors.map((honor, hIndex) => (
                          <li key={hIndex}>{honor}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {portfolio.experience && portfolio.experience.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Experience</h2>
              <div className="space-y-3">
                {portfolio.experience.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border border-gray-200 rounded-md p-3">
                    <p className="font-medium text-gray-900">{item.title} — {item.organization}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {[item.startDate, item.endDate ? `- ${item.endDate}` : '', item.location].filter(Boolean).join(' ')}
                    </p>
                    {item.responsibilities && item.responsibilities.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                        {item.responsibilities.map((point, pIndex) => (
                          <li key={pIndex}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {portfolio.projects && portfolio.projects.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Projects</h2>
              <div className="space-y-3">
                {portfolio.projects.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border border-gray-200 rounded-md p-3">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{item.description}</p>
                    {item.technologies && item.technologies.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">Tech: {item.technologies.join(', ')}</p>
                    )}
                    {(item.githubUrl || item.liveUrl) && (
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {item.githubUrl && (
                          <a href={item.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>
                        )}
                        {item.liveUrl && (
                          <a href={item.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Live Demo</a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {portfolio.achievements && portfolio.achievements.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Achievements & Certifications</h2>
              <div className="space-y-3">
                {portfolio.achievements.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border border-gray-200 rounded-md p-3">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {[item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '', item.organization, item.date]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                    {item.description && <p className="text-sm text-gray-700 mt-2">{item.description}</p>}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                        Learn more
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(portfolio.leadershipActivities?.length || portfolio.coursework?.length || portfolio.portfolioHighlights?.length) && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Additional Details</h2>
              <div className="space-y-3 text-sm text-gray-700">
                {portfolio.leadershipActivities && portfolio.leadershipActivities.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900">Leadership & Activities</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {portfolio.leadershipActivities.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {portfolio.coursework && portfolio.coursework.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900">Coursework</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {portfolio.coursework.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {portfolio.portfolioHighlights && portfolio.portfolioHighlights.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900">Portfolio Highlights</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {portfolio.portfolioHighlights.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {(portfolio.links || portfolio.resumeFileName || portfolio.resumeUrl) && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Links & Resume</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                {portfolio.links?.linkedin && (
                  <a href={portfolio.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
                )}
                {portfolio.links?.github && (
                  <a href={portfolio.links.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>
                )}
                {portfolio.links?.website && (
                  <a href={portfolio.links.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Website</a>
                )}
                {id && (portfolio.resumeFileName || portfolio.resumeUrl) && (
                  <a href={`/api/member-portfolios/${id}/resume`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resume</a>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Review Decision</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || rejecting || status !== 'pending'}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {approving ? 'Approving...' : 'Approve'}
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <select
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                setRejectReason(value);
                e.currentTarget.value = '';
              }}
              disabled={approving || rejecting || status !== 'pending'}
              className="w-full md:w-auto border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Use rejection template...</option>
              {REJECTION_TEMPLATES.map((template, index) => (
                <option key={index} value={template}>{`Template ${index + 1}`}</option>
              ))}
            </select>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={approving || rejecting || status !== 'pending'}
              placeholder="Rejection reason (required)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={handleReject}
              disabled={approving || rejecting || status !== 'pending' || !rejectReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {rejecting ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
