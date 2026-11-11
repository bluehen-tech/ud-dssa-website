'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GithubUsernameForm({ current }: { current: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!current);
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/learn/github-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save your username.');
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your username.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing && current) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <span>
          Your GitHub username: <strong className="font-semibold text-gray-900">{current}</strong>
        </span>
        <button type="button" onClick={() => setEditing(true)} className="text-blue-primary hover:underline">
          Change
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-2">
      <label htmlFor="github-username" className="block text-sm font-medium text-gray-800">
        Your GitHub username
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="github-username"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="your-username"
          autoComplete="off"
          spellCheck={false}
          className="w-64 max-w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 focus:ring-2 focus:ring-blue-primary focus:border-transparent"
        />
        <button
          type="submit"
          disabled={saving || !value.trim()}
          className="px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors disabled:opacity-60"
        >
          {saving ? 'Checking...' : 'Save'}
        </button>
        {current && (
          <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 text-sm text-gray-600 hover:underline">
            Cancel
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">The site checks that this username exists on GitHub. Stage 7 uses it.</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
