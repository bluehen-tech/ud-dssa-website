import Link from 'next/link';
import type { MissingStep } from '@/lib/learn/access';

const STEP_TEXT: Record<MissingStep, string> = {
  portfolio: 'Create your member portfolio.',
  publish: 'Publish your portfolio.',
  photo: 'Add a photo to your portfolio.',
};

export default function LockedNotice({ missing }: { missing: MissingStep[] }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-primary mb-2">The Builder Path opens after your portfolio is live</h2>
      <p className="text-gray-700 mb-4">
        The path starts with your own member card. Finish these steps, then come back to this page.
      </p>
      <ol className="list-decimal pl-6 space-y-1 text-gray-800 mb-6">
        {missing.map((step) => (
          <li key={step}>{STEP_TEXT[step]}</li>
        ))}
      </ol>
      <Link
        href="/members/me"
        className="inline-flex items-center px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
      >
        Go to my portfolio
      </Link>
    </div>
  );
}
