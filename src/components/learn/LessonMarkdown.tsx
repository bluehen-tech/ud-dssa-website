import { Marked } from 'marked';

const lessonMarked = new Marked({ gfm: true });

/** Renders Builder Path markdown from the repo. Content is written by officers, not learners. */
export default function LessonMarkdown({
  content,
  replacements = {},
}: {
  content: string;
  replacements?: Record<string, string>;
}) {
  const filled = Object.entries(replacements).reduce(
    (text, [key, value]) => text.split(`{{${key}}}`).join(value),
    content
  );
  const html = lessonMarked.parse(filled, { async: false }) as string;

  return (
    <div
      className="prose prose-slate max-w-none prose-headings:text-blue-primary prose-a:text-blue-primary prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-normal"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
