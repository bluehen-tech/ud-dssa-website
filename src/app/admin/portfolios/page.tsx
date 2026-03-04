'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { dbRowToMemberPortfolio } from '@/lib/memberPortfolioUtils';
import type { MemberPortfolioRow } from '@/types/member';

interface PendingPortfolio extends MemberPortfolioRow {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
}

const REJECTION_TEMPLATES = [
  'Please expand your bio with clearer details about your interests and goals.',
  'Please add at least one complete experience or project entry with meaningful descriptions.',
  'One or more links appear invalid or incomplete. Please update your links and resubmit.',
  'Please improve formatting and clarity (skills, achievements, and role details).',
];

export default function AdminPortfoliosPage() {
  const router = useRouter();
  const { session, isAdmin, isLoading: authLoading } = useAuth();
  const [portfolios, setPortfolios] = useState<PendingPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

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
    fetchPending();
  }, [session, isAdmin, authLoading, router]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/member-portfolios/pending');
      const data = await res.json();
      if (data.success && Array.isArray(data.portfolios)) {
        setPortfolios(data.portfolios);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/member-portfolios/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      await fetchPending();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReason[id] ?? '';
    setRejectingId(id);
    try {
      const res = await fetch(`/api/member-portfolios/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setRejectReason((r) => ({ ...r, [id]: '' }));
      await fetchPending();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setRejectingId(null);
    }
  };

  if (authLoading || (!session && !isAdmin)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-primary">Pending portfolio approvals</h1>
          <Link href="/members" className="text-blue-primary hover:underline text-sm">← Members</Link>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : portfolios.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-600">No portfolios pending approval.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {portfolios.map((row) => {
              const display = dbRowToMemberPortfolio(row as MemberPortfolioRow);
              return (
                <li key={row.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{display.name}</p>
                      {display.tagline && <p className="text-sm text-gray-600 mt-1">{display.tagline}</p>}
                      {display.bio && <p className="text-sm text-gray-700 mt-2 line-clamp-2">{display.bio}</p>}
                      {row.submitted_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted {new Date(row.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/portfolios/${row.id}`}
                        className="px-4 py-2 bg-blue-50 text-blue-primary text-sm font-medium rounded-md border border-blue-200 hover:bg-blue-100 text-center"
                      >
                        See complete portfolio
                      </Link>
                      <button
                        onClick={() => handleApprove(row.id)}
                        disabled={approvingId === row.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {approvingId === row.id ? 'Approving...' : 'Approve'}
                      </button>
                      <div className="flex flex-col gap-1">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            setRejectReason((r) => ({ ...r, [row.id]: value }));
                            e.currentTarget.value = '';
                          }}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="">Use rejection template...</option>
                          {REJECTION_TEMPLATES.map((template, index) => (
                            <option key={index} value={template}>{`Template ${index + 1}`}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Rejection reason (required)"
                          value={rejectReason[row.id] ?? ''}
                          onChange={(e) => setRejectReason((r) => ({ ...r, [row.id]: e.target.value }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleReject(row.id)}
                          disabled={rejectingId === row.id || !(rejectReason[row.id] ?? '').trim()}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {rejectingId === row.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
