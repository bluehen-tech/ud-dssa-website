import type { StackPart } from '@/lib/learn/types';

const PARTS: { id: StackPart; name: string; role: string }[] = [
  { id: 'cursor', name: 'Cursor', role: 'Where code is written' },
  { id: 'github', name: 'GitHub', role: 'Where code is kept' },
  { id: 'nextjs', name: 'Next.js + Tailwind', role: 'Pages and styles' },
  { id: 'vercel', name: 'Vercel', role: 'Puts the site online' },
  { id: 'supabase', name: 'Supabase', role: 'Database, sign-in, files' },
  { id: 'resend', name: 'Resend', role: 'Sends email' },
];

export default function StackMap({ highlight }: { highlight: StackPart[] }) {
  return (
    <figure aria-label="The DSSA stack" className="my-2">
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
              <p className={`text-sm font-semibold ${on ? 'text-white' : 'text-gray-700'}`}>{part.name}</p>
              <p className={`mt-1 text-xs ${on ? 'text-blue-100' : 'text-gray-500'}`}>{part.role}</p>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-2 text-xs text-gray-500">
        The DSSA stack. Highlighted parts are covered in this stage.
      </figcaption>
    </figure>
  );
}
