'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { MemberPortfolio, MemberRole } from '@/types/member';
import PortfolioView from '@/components/members/PortfolioView';

interface PortfolioApiResponse {
  success: boolean;
  message?: string;
  portfolio?: MemberPortfolio;
  status?: string;
  role?: MemberRole;
  isOwner?: boolean;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  officer: 'Officer',
  member: 'Current Member',
  alumni: 'Alumni',
};

export default function MemberDetailPage() {
  const { isAdmin, session } = useAuth();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [portfolio, setPortfolio] = useState<MemberPortfolio | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/member-portfolios/${id}`)
      .then((res) => res.json())
      .then((data: PortfolioApiResponse) => {
        if (data.success && data.portfolio) {
          setPortfolio(data.portfolio);
          setIsOwner(Boolean(data.isOwner));
          setStatus(data.status || 'published');
          setSelectedRole(data.portfolio.role);
        } else {
          setError('Portfolio not found');
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateMemberRole = async () => {
    if (!id || !isAdmin || !portfolio || selectedRole === portfolio.role) return;

    setUpdatingRole(true);
    setRoleMessage(null);
    try {
      const res = await fetch(`/api/member-portfolios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data: PortfolioApiResponse = await res.json();
      if (!res.ok || !data.success || !data.role) {
        throw new Error(data.message || 'Failed to update membership status');
      }

      setPortfolio((current) => current ? { ...current, role: data.role! } : current);
      setSelectedRole(data.role);
      setRoleMessage({ type: 'success', text: `Moved to ${ROLE_LABELS[data.role]}.` });
    } catch (e) {
      setRoleMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to update membership status',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const rejectPortfolio = async () => {
    if (!id || !isAdmin) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Rejection reason is required.');
      return;
    }

    setRejectError(null);
    setRejecting(true);
    try {
      const res = await fetch(`/api/member-portfolios/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      const data: PortfolioApiResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reject portfolio');
      }

      setStatus('rejected');
      setRejectReason('');
      setError('Portfolio rejected successfully. It will no longer appear in the public members list.');
    } catch (e) {
      setRejectError(e instanceof Error ? e.message : 'Failed to reject portfolio');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600 mb-4">{error || 'Portfolio not found'}</p>
          {session && (
            <p className="text-sm text-gray-600 mb-4">
              Looking for your own portfolio?{' '}
              <Link href="/members/me" className="text-blue-primary hover:underline">
                Open My portfolio
              </Link>
            </p>
          )}
          <Link href="/members" className="text-blue-primary hover:underline">← Back to Members</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/members" className="text-blue-primary hover:underline text-sm">← Back to Members</Link>
        </div>
        {isOwner && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-blue-primary">This is your public portfolio</p>
              <p className="text-sm text-gray-700 mt-1">This is what other members and visitors see.</p>
            </div>
            <Link
              href="/members/me"
              className="shrink-0 px-4 py-2 bg-blue-primary text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors text-center"
            >
              Edit portfolio
            </Link>
          </div>
        )}
        <PortfolioView portfolio={portfolio} resumeHref={id ? `/api/member-portfolios/${id}/resume` : undefined}>
          {isAdmin && (
            <section className="pt-6 mt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Admin Controls</h2>
              <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <label htmlFor="membership-status" className="block text-sm font-semibold text-gray-900">
                  Membership status
                </label>
                <p className="mt-1 text-sm text-gray-600">
                  Move this portfolio to the correct section of the members directory.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    id="membership-status"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as MemberRole);
                      setRoleMessage(null);
                    }}
                    disabled={updatingRole}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-primary focus:outline-none focus:ring-2 focus:ring-blue-primary/30 disabled:opacity-60"
                  >
                    <option value="officer">Officer</option>
                    <option value="member">Current Member</option>
                    <option value="alumni">Alumni</option>
                  </select>
                  <button
                    type="button"
                    onClick={updateMemberRole}
                    disabled={updatingRole || selectedRole === portfolio.role}
                    className="rounded-md bg-blue-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingRole ? 'Saving...' : 'Update status'}
                  </button>
                </div>
                {roleMessage && (
                  <p
                    aria-live="polite"
                    className={`mt-3 text-sm ${roleMessage.type === 'success' ? 'text-green-700' : 'text-red-600'}`}
                  >
                    {roleMessage.text}
                  </p>
                )}
              </div>
              {status === 'published' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Reject this portfolio to remove it from the public members page.
                  </p>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (required)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {rejectError && <p className="text-sm text-red-600">{rejectError}</p>}
                  <button
                    type="button"
                    onClick={rejectPortfolio}
                    disabled={rejecting || !rejectReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {rejecting ? 'Rejecting...' : 'Reject Portfolio'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  This portfolio is currently <span className="font-medium">{status || 'not published'}</span> and cannot be rejected.
                </p>
              )}
            </section>
          )}
        </PortfolioView>
      </div>
    </div>
  );
}
