import { Marked, type Token, type TokenizerAndRendererExtension, type Tokens } from 'marked';
import { findWord } from '@/content/learn/glossary';

/**
 * Turns Builder Path markdown into HTML. On top of normal markdown, lessons
 * and build cards can use three things:
 *
 *   :::short            The short version: a box at the top of a lesson.
 *   - one idea          A learner who knows these skips to the build card.
 *   :::
 *
 *   :::more Title       Optional detail, closed until the learner opens it.
 *   Any markdown.       Nothing the concept check asks may be only in here.
 *   :::
 *
 *   [[word]]            A word from glossary.ts. Tapping it shows the
 *                       plain definition.
 *
 * This file lives in src/components so Tailwind sees the class names below.
 */

export interface LessonHtmlOptions {
  /** Values for {{name}} placeholders. */
  replacements?: Record<string, string>;
  /** When set, the short version ends with a link to this address (the build card). */
  skipHref?: string;
}

/** Styling for a tappable word. Shared with the word lists on the stage and Words pages. */
export const WORD_CLASSES =
  'cursor-help rounded-sm underline decoration-dotted decoration-2 decoration-blue-primary underline-offset-4 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-primary';

const CHECKBOX_CLASSES = 'mr-1 h-4 w-4 cursor-pointer align-[-2px] accent-blue-primary';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wordHtml(shown: string, word: string, definition: string): string {
  return `<span data-word="${escapeHtml(word)}" data-definition="${escapeHtml(
    definition
  )}" role="button" tabindex="0" class="${WORD_CLASSES}">${escapeHtml(shown)}</span>`;
}

interface BlockToken extends Tokens.Generic {
  kind: 'short' | 'more';
  title: string;
  tokens: Token[];
}

function createMarked(skipHref?: string): Marked {
  const block: TokenizerAndRendererExtension = {
    name: 'lessonBlock',
    level: 'block',
    start(src) {
      return src.match(/^:::(short|more)/m)?.index;
    },
    tokenizer(src) {
      const match = /^:::(short|more)[ \t]*([^\n]*)\n([\s\S]*?)\n:::[ \t]*(?:\n+|$)/.exec(src);
      if (!match) return undefined;
      const token: BlockToken = {
        type: 'lessonBlock',
        raw: match[0],
        kind: match[1] as BlockToken['kind'],
        title: match[2].trim(),
        tokens: [],
      };
      this.lexer.blockTokens(match[3], token.tokens);
      return token;
    },
    renderer(token) {
      const { kind, title, tokens } = token as BlockToken;
      const body = this.parser.parse(tokens);

      if (kind === 'short') {
        const skip = skipHref
          ? `<div class="not-prose mt-3 text-sm"><a href="${escapeHtml(
              skipHref
            )}" class="font-medium text-blue-primary underline">Know this already? Go to the build card</a></div>`
          : '';
        return `<div class="my-6 rounded-lg border-l-4 border-gold bg-blue-50 px-5 py-4"><div class="not-prose text-xs font-semibold uppercase tracking-wide text-blue-primary">The short version</div>${body}${skip}</div>\n`;
      }

      return `<details class="group my-4 rounded-lg border border-gray-200 bg-gray-50"><summary class="not-prose flex cursor-pointer select-none list-none items-center gap-2 px-4 py-3 text-sm font-medium text-blue-primary hover:bg-gray-100 [&::-webkit-details-marker]:hidden"><span aria-hidden="true" class="inline-block transition-transform group-open:rotate-90">&#9656;</span><span>${escapeHtml(
        title || 'More detail'
      )}</span><span class="ml-auto text-xs font-normal text-gray-500 group-open:hidden">Optional</span></summary><div class="border-t border-gray-200 px-4 pb-1">${body}</div></details>\n`;
    },
  };

  const word: TokenizerAndRendererExtension = {
    name: 'lessonWord',
    level: 'inline',
    start(src) {
      const index = src.indexOf('[[');
      return index < 0 ? undefined : index;
    },
    tokenizer(src) {
      const match = /^\[\[([^\[\]\n]+)\]\]/.exec(src);
      if (!match) return undefined;
      return { type: 'lessonWord', raw: match[0], text: match[1].trim() };
    },
    renderer(token) {
      const shown = String(token.text);
      const entry = findWord(shown);
      // An unknown word renders as plain text. The content test reports it.
      return entry ? wordHtml(shown, entry.word, entry.definition) : escapeHtml(shown);
    },
  };

  return new Marked({ gfm: true }).use({
    extensions: [block, word],
    renderer: {
      // A "- [ ]" item is a box for the learner to tick. Markdown's own version cannot be clicked.
      // <TickMemory /> remembers which boxes are ticked.
      checkbox({ checked }) {
        return `<input type="checkbox"${checked ? ' checked=""' : ''} class="${CHECKBOX_CLASSES}"> `;
      },
      // The label makes the item's text tick the box too, and names the box for screen readers.
      listitem(item) {
        if (!item.task) return false;
        return `<li class="list-none -ml-6"><label class="cursor-pointer">${this.parser.parse(item.tokens)}</label></li>\n`;
      },
    },
  });
}

export function renderLessonHtml(content: string, options: LessonHtmlOptions = {}): string {
  const filled = Object.entries(options.replacements ?? {}).reduce(
    (text, [key, value]) => text.split(`{{${key}}}`).join(value),
    content
  );
  return createMarked(options.skipHref).parse(filled, { async: false }) as string;
}

export function hasOptionalDetails(content: string): boolean {
  return /^:::more/m.test(content);
}
