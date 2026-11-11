'use client';

import { useState } from 'react';

/** Opens or closes every optional "more" section inside the element with the given id. */
export default function DetailsToggle({ targetId }: { targetId: string }) {
  const [allOpen, setAllOpen] = useState(false);

  const toggle = () => {
    const next = !allOpen;
    document
      .getElementById(targetId)
      ?.querySelectorAll('details')
      .forEach((details) => {
        details.open = next;
      });
    setAllOpen(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={allOpen}
      className="shrink-0 whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      {allOpen ? 'Close all details' : 'Open all details'}
    </button>
  );
}
