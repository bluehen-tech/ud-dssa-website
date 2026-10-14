import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true,
});

const IMG_STYLE =
  "max-width:100%;height:auto;border:0;outline:none;text-decoration:none;border-radius:8px;display:block;margin:16px auto;";

/**
 * Add email-client-safe attributes to every <img>: inline styles, an alt
 * attribute (empty if missing), and keep any explicit width attribute so
 * Outlook (which ignores CSS max-width) sizes it correctly.
 */
function styleImgTag(tag: string): string {
  const hasAlt = /\salt\s*=/.test(tag);
  const withoutStyle = tag.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/i, "");
  return withoutStyle.replace(
    /^<img\b/,
    `<img style="${IMG_STYLE}"${hasAlt ? "" : ' alt=""'}`
  );
}

/**
 * Convert markdown to email-safe HTML with inline styles.
 * Email clients don't support <style> blocks, so we inline everything.
 *
 * Shared by the server (uddssaMailer) and the client (EmailPreview) so the
 * preview always matches what is sent.
 */
export function markdownToEmailHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown) as string;

  return rawHtml
    .replace(/<h1(.*?)>/g, '<h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#1B365D;line-height:1.3;">')
    .replace(/<h2(.*?)>/g, '<h2 style="margin:24px 0 12px;font-size:22px;font-weight:600;color:#1B365D;line-height:1.3;">')
    .replace(/<h3(.*?)>/g, '<h3 style="margin:20px 0 8px;font-size:18px;font-weight:600;color:#1B365D;line-height:1.3;">')
    .replace(/<p(.*?)>/g, '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333333;">')
    .replace(/<ul(.*?)>/g, '<ul style="margin:0 0 16px;padding-left:24px;color:#333333;">')
    .replace(/<ol(.*?)>/g, '<ol style="margin:0 0 16px;padding-left:24px;color:#333333;">')
    .replace(/<li(.*?)>/g, '<li style="margin:0 0 8px;font-size:16px;line-height:1.5;">')
    .replace(/<a /g, '<a style="color:#1B365D;font-weight:500;text-decoration:underline;" ')
    .replace(/<hr\s*\/?>/g, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />')
    .replace(/<blockquote(.*?)>/g, '<blockquote style="margin:16px 0;padding:12px 20px;border-left:4px solid #D4A020;background:#f8f9fa;font-style:italic;color:#555555;">')
    .replace(/<img\b[^>]*>/g, styleImgTag)
    .replace(/<strong(.*?)>/g, '<strong style="font-weight:600;color:#1a1a1a;">')
    .replace(/<em(.*?)>/g, '<em style="font-style:italic;">');
}
