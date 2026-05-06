import React from 'react';

interface MarkdownPreviewProps {
  content: string;
  compact?: boolean;
}

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`${match.index}-bold`} className="font-semibold text-gray-950">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`${match.index}-code`} className="rounded bg-gray-100 px-1 py-0.5 text-[0.9em]">
          {token.slice(1, -1)}
        </code>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={`${match.index}-link`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-primary hover:text-blue-800 hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function MarkdownPreview({ content, compact = false }: MarkdownPreviewProps) {
  const trimmed = content.trim();

  if (!trimmed) {
    return <p className="text-sm text-gray-500">Nothing to preview yet.</p>;
  }

  const lines = trimmed.split('\n');
  const visibleLines = compact ? lines.slice(0, 7) : lines;
  const blocks: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc space-y-1 pl-5">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  visibleLines.forEach((line, index) => {
    const text = line.trim();

    if (!text) {
      flushList(`list-${index}`);
      blocks.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    const bullet = text.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(<li key={`item-${index}`}>{renderInline(bullet[1])}</li>);
      return;
    }

    flushList(`list-${index}`);

    if (text.startsWith('### ')) {
      blocks.push(
        <h4 key={index} className="text-base font-semibold text-gray-950">
          {renderInline(text.slice(4))}
        </h4>
      );
      return;
    }

    if (text.startsWith('## ')) {
      blocks.push(
        <h3 key={index} className="text-lg font-semibold text-gray-950">
          {renderInline(text.slice(3))}
        </h3>
      );
      return;
    }

    if (text.startsWith('# ')) {
      blocks.push(
        <h2 key={index} className="text-xl font-semibold text-gray-950">
          {renderInline(text.slice(2))}
        </h2>
      );
      return;
    }

    if (text.startsWith('> ')) {
      blocks.push(
        <blockquote key={index} className="border-l-4 border-gray-200 pl-3 text-gray-600">
          {renderInline(text.slice(2))}
        </blockquote>
      );
      return;
    }

    blocks.push(
      <p key={index} className="leading-7">
        {renderInline(text)}
      </p>
    );
  });

  flushList('list-final');

  return (
    <div className={`space-y-3 text-sm text-gray-700 ${compact ? 'line-clamp-6' : ''}`}>
      {blocks}
      {compact && lines.length > visibleLines.length && (
        <p className="text-xs font-medium text-gray-500">Continue reading in comments...</p>
      )}
    </div>
  );
}
