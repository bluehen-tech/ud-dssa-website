'use client';

import { useEffect } from 'react';

function readTicked(storageKey: string): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Remembers which checklist boxes a learner has ticked inside the element with the given id.
 * Ticks are kept in this browser only, under storageKey, and matched to items by their text,
 * so editing a checklist does not move ticks onto the wrong items.
 */
export default function TickMemory({ targetId, storageKey }: { targetId: string; storageKey: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const boxes = () => Array.from(target.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    const itemText = (box: HTMLInputElement) => (box.closest('li')?.textContent ?? '').trim();

    const restore = () => {
      const ticked = new Set(readTicked(storageKey));
      for (const box of boxes()) box.checked = ticked.has(itemText(box));
    };

    const save = () => {
      const ticked = boxes().filter((box) => box.checked).map(itemText);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(ticked));
      } catch {
        // Storage can be turned off. The boxes still tick; they are not remembered.
      }
    };

    restore();
    target.addEventListener('change', save);
    // The card is drawn again when the page refreshes its data, such as after saving a GitHub username.
    const observer = new MutationObserver(restore);
    observer.observe(target, { childList: true });

    return () => {
      target.removeEventListener('change', save);
      observer.disconnect();
    };
  }, [targetId, storageKey]);

  return null;
}
