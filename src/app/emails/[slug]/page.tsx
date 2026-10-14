import { createClient } from "@/lib/supabase-server";
import { getBaseURL } from "@/lib/get-url";
import { marked } from "marked";
import { notFound } from "next/navigation";
import Link from "next/link";

marked.setOptions({ breaks: true, gfm: true });

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/---/g, "")
    .replace(/>\s+/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

const EMAIL_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  newsletter: { bg: "bg-blue-100", text: "text-blue-800" },
  event: { bg: "bg-purple-100", text: "text-purple-800" },
  opportunity: { bg: "bg-green-100", text: "text-green-800" },
  announcement: { bg: "bg-amber-100", text: "text-amber-800" },
};

export default async function PublicEmailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: email, error } = await supabase
    .from("sent_emails")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (error || !email) {
    notFound();
  }

  const bodyHtml = marked.parse(
    email.body_markdown
      .replace(/\{name(\|[^}]*)?\}/g, "DSSA Member")
      .replace(/\{first_name(\|[^}]*)?\}/g, "DSSA Member")
      .replace(/\{email(\|[^}]*)?\}/g, "")
  ) as string;

  const baseUrl = getBaseURL();
  const canonicalUrl = `${baseUrl}/emails/${email.slug}`;
  const plainDescription = stripMarkdown(email.body_markdown).slice(0, 160);
  const sentDate = new Date(email.sent_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const typeColors = EMAIL_TYPE_COLORS[email.email_type] || EMAIL_TYPE_COLORS.newsletter;

  return (
    <>
      <head>
        <title>{email.subject} | DSSA</title>
        <meta name="description" content={plainDescription} />
        <meta property="og:title" content={email.subject} />
        <meta property="og:description" content={plainDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="UD Data Science Student Association" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={email.subject} />
        <meta name="twitter:description" content={plainDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </head>

      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <article className="max-w-3xl mx-auto px-4 py-10">
          {/* Header card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Top banner */}
            <div className="bg-[#0d1031] px-8 py-6 text-center">
              <p className="text-3xl font-extrabold text-white tracking-tight">
                DSSA
              </p>
              <div className="mx-auto w-16 border-t-2 border-[#D4A020] my-2" />
              <p className="text-xs uppercase tracking-widest text-gray-400">
                Data Science Student Association
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                University of Delaware
              </p>
              {email.sender_label && (
                <span className="inline-block mt-3 px-4 py-1 bg-[#D4A020] rounded text-xs font-bold text-[#0d1031] tracking-wide">
                  {email.sender_label}
                </span>
              )}
            </div>

            {/* Subject + meta */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}
                >
                  {email.email_type}
                </span>
                <span className="text-sm text-gray-400">{sentDate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {email.subject}
              </h1>
            </div>

            {/* Body */}
            <div
              className="px-8 pb-10 prose prose-gray max-w-none
                prose-headings:text-[#1B365D] prose-headings:font-semibold
                prose-a:text-[#1B365D] prose-a:font-medium
                prose-strong:text-gray-900
                prose-blockquote:border-l-[#D4A020] prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:px-4
                prose-img:rounded-lg prose-img:mx-auto
                prose-hr:border-gray-200"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-sm text-gray-500">
                Data Science Student Association @ University of Delaware
              </p>
              <Link
                href="/"
                className="text-sm text-[#1B365D] hover:underline mt-1 inline-block"
              >
                Visit bluehen-dssa.org
              </Link>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
