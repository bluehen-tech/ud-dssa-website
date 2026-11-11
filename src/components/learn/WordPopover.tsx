'use client';

import { useEffect, useRef, useState } from 'react';

interface OpenWord {
  word: string;
  definition: string;
  left: number;
  width: number;
  /** Set one of these: the popover sits below the word, or above it near the bottom of the window. */
  top?: number;
  bottom?: number;
}

const MARGIN = 8;
const MAX_WIDTH = 320;

/**
 * Shows the definition of a [[word]] from a lesson. Hovering or focusing a word shows it.
 * Clicking or tapping keeps it open until the learner clicks elsewhere, scrolls or presses Escape.
 * Render once per page.
 */
export default function WordPopover() {
  const [open, setOpen] = useState<OpenWord | null>(null);
  const pinned = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const wordAt = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-word]') : null;

    const show = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      // clientWidth leaves out the scrollbar, so the popover never sits under it.
      const viewWidth = document.documentElement.clientWidth;
      const width = Math.min(MAX_WIDTH, viewWidth - MARGIN * 2);
      const left = Math.max(MARGIN, Math.min(rect.left, viewWidth - width - MARGIN));
      const below = window.innerHeight - rect.bottom > 140;
      setOpen({
        word: el.dataset.word ?? '',
        definition: el.dataset.definition ?? '',
        left,
        width,
        ...(below ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
      });
    };

    const close = () => {
      pinned.current = null;
      setOpen(null);
    };

    const toggle = (el: HTMLElement) => {
      if (pinned.current === el) {
        close();
      } else {
        pinned.current = el;
        show(el);
      }
    };

    const onClick = (event: MouseEvent) => {
      const el = wordAt(event.target);
      if (el) toggle(el);
      else if (!(event.target instanceof Element && event.target.closest('[data-word-popover]'))) close();
    };
    const onEnter = (event: Event) => {
      const el = wordAt(event.target);
      if (el && !pinned.current) show(el);
    };
    const onLeave = (event: Event) => {
      if (wordAt(event.target) && !pinned.current) setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      const el = wordAt(event.target);
      if (el && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        toggle(el);
      }
    };

    document.addEventListener('click', onClick);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    document.addEventListener('focusin', onEnter);
    document.addEventListener('focusout', onLeave);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      document.removeEventListener('focusin', onEnter);
      document.removeEventListener('focusout', onLeave);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, []);

  return (
    <div role="status" aria-live="polite">
      {open && (
        <div
          data-word-popover
          className="fixed z-[60] rounded-lg border border-blue-200 bg-white p-3 text-sm shadow-xl"
          style={{ left: open.left, width: open.width, top: open.top, bottom: open.bottom }}
        >
          <p className="font-semibold text-blue-primary">{open.word}</p>
          <p className="mt-1 text-gray-700">{open.definition}</p>
        </div>
      )}
    </div>
  );
}
