/**
 * Generates a URL-friendly slug from a date and subject line.
 * Example: "Spring Data Hackathon" on 2026-05-13 → "2026-05-13-spring-data-hackathon"
 */
export function generateEmailSlug(subject: string, sentAt?: Date): string {
  const date = sentAt ?? new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const datePrefix = `${yyyy}-${mm}-${dd}`;

  const slugBody = subject
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${datePrefix}-${slugBody || "email"}`;
}

/**
 * Given a base slug and a set of existing slugs, return a unique variant
 * by appending a numeric suffix if needed.
 */
export function deduplicateSlug(
  base: string,
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(base)) return base;

  let n = 2;
  while (existingSlugs.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
