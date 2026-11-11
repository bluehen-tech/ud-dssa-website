import { renderLessonHtml, type LessonHtmlOptions } from './lessonHtml';

// The grey chip styling is for inline code only. Code inside a block keeps the dark block's own colors.
const INLINE_CODE =
  'prose-code:before:content-none prose-code:after:content-none [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-gray-100 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-normal';

/**
 * Renders Builder Path markdown from the repo. Content is written by officers, not learners.
 * The page that uses this must also render <WordPopover /> once, so tapped words show their definitions.
 */
export default function LessonMarkdown({
  content,
  id,
  ...options
}: { content: string; id?: string } & LessonHtmlOptions) {
  const html = renderLessonHtml(content, options);

  return (
    <div
      id={id}
      className={`prose prose-slate max-w-none prose-headings:text-blue-primary prose-a:text-blue-primary ${INLINE_CODE}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
