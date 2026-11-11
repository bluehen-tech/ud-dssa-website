'use client';

import { QRCodeSVG } from 'qrcode.react';
import { LEARN_FULL_URL, LEARN_SHORT_URL } from '@/lib/learn/constants';

function HandoutCard() {
  return (
    <div className="handout-card flex flex-col gap-5 rounded-lg border-2 border-blue-primary bg-white p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">DSSA @ UD · Builders Day</p>
          <h1 className="text-4xl font-bold text-blue-primary">Builder Path</h1>
          <p className="mt-1 text-lg text-gray-700">A beginner route into the tools behind bluehen-dssa.org.</p>
        </div>
        <div className="shrink-0 text-center">
          <QRCodeSVG value={LEARN_FULL_URL} size={120} level="M" fgColor="#00539F" />
        </div>
      </div>

      <div className="rounded-md bg-blue-50 p-4">
        <p className="text-sm text-gray-700">Open this address on a laptop. The building is done there.</p>
        <p className="font-mono text-2xl font-semibold text-blue-primary">{LEARN_SHORT_URL}</p>
      </div>

      <ol className="list-decimal space-y-1 pl-6 text-gray-800">
        <li>Sign in with your @udel.edu email.</li>
        <li>Publish your member portfolio with a photo. The path unlocks.</li>
        <li>Work through seven stages at your own pace. Each has a short lesson, a concept check and a build card.</li>
        <li>Finish by adding a tip to the DSSA site with your first pull request.</li>
      </ol>

      <div className="border-t border-gray-200 pt-3 text-sm text-gray-600">
        <p>
          <strong className="text-gray-800">You need:</strong> a Windows or Mac laptop you can install apps on. The
          accounts you will make are free: Cursor, GitHub, Vercel and Supabase.
        </p>
        <p className="mt-1">Not for credit. Your member card shows how many stages you have cleared.</p>
      </div>
    </div>
  );
}

export default function BuildersDayHandoutPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body { background: white !important; }
          main, .handout-page { padding: 0 !important; margin: 0 !important; }
          .handout-sheet { gap: 0 !important; }
          .handout-card { break-inside: avoid; height: 4.9in; }
          .handout-cut { display: block !important; }
          @page { size: letter; margin: 0.4in; }
        }
      `}</style>

      <div className="handout-page max-w-3xl mx-auto">
        <div className="no-print mb-6 bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-blue-primary mb-1">Builders Day handout</h1>
          <p className="text-gray-600 mb-4">
            Prints two cards per letter sheet. Cut along the dashed line and hand one to each newcomer.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
          >
            Print
          </button>
        </div>

        <div className="handout-sheet flex flex-col gap-6">
          <HandoutCard />
          <div className="handout-cut hidden border-t-2 border-dashed border-gray-400 my-[0.2in]" aria-hidden="true" />
          <HandoutCard />
        </div>
      </div>
    </div>
  );
}
