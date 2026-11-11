import type { BuilderBadge as Badge } from '@/types/member';

export default function BuilderBadge({ badge, size = 'sm' }: { badge?: Badge; size?: 'sm' | 'md' }) {
  if (!badge) return null;
  const text = size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {badge.level > 0 && (
        <span className={`inline-flex items-center rounded-full bg-blue-50 font-medium text-blue-primary ${text}`}>
          Builder Path {badge.level} of {badge.total}
        </span>
      )}
      {badge.contributor && (
        <span className={`inline-flex items-center rounded-full bg-gold/30 font-medium text-gray-900 ${text}`}>
          Contributor
        </span>
      )}
    </div>
  );
}
