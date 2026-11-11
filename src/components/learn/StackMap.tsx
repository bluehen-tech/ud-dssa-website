import type { StackPart } from '@/lib/learn/types';

/** Each box leads with the job in plain words. The tool's name comes second, because most learners have not met it yet. */
const PARTS: { id: StackPart; job: string; tool: string }[] = [
  { id: 'cursor', job: 'Write the code', tool: 'Cursor' },
  { id: 'github', job: 'Keep the code', tool: 'GitHub' },
  { id: 'nextjs', job: 'Build the pages', tool: 'Next.js + Tailwind' },
  { id: 'vercel', job: 'Put it on the web', tool: 'Vercel' },
  { id: 'supabase', job: 'Keep the data', tool: 'Supabase' },
  { id: 'resend', job: 'Send email', tool: 'Resend' },
];

export default function StackMap({ highlight }: { highlight: StackPart[] }) {
  const all = highlight.length === PARTS.length;
  return (
    <figure aria-label="The six jobs behind the DSSA site" className="my-2">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {PARTS.map((part) => {
          const on = highlight.includes(part.id);
          return (
            <li
              key={part.id}
              className={`rounded-lg border p-3 text-center transition-colors ${
                on ? 'border-blue-primary bg-blue-primary text-white' : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              <p className={`text-sm font-semibold ${on ? 'text-white' : 'text-gray-700'}`}>{part.job}</p>
              <p className={`mt-1 text-xs ${on ? 'text-blue-100' : 'text-gray-500'}`}>{part.tool}</p>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-2 text-xs text-gray-500">
        Six jobs keep bluehen-dssa.org running. The small print names the tool that does each job.{' '}
        {all
          ? 'This path covers all six.'
          : `This stage covers the highlighted ${highlight.length === 1 ? 'job' : 'jobs'}.`}
      </figcaption>
    </figure>
  );
}
