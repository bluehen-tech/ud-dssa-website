import Link from 'next/link';

export function LearnShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">{children}</div>
    </div>
  );
}

export function LearnUnavailable({ reason }: { reason: 'not-configured' | 'signed-out' }) {
  return (
    <LearnShell>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-primary mb-2">Builder Path</h1>
        {reason === 'signed-out' ? (
          <>
            <p className="text-gray-700 mb-4">Sign in with your @udel.edu email to start the Builder Path.</p>
            <Link
              href="/login?redirect=/learn"
              className="inline-flex items-center px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
            >
              Sign in
            </Link>
          </>
        ) : (
          <p className="text-gray-700">The Builder Path needs the site&apos;s database, which is not set up in this copy.</p>
        )}
      </div>
    </LearnShell>
  );
}
