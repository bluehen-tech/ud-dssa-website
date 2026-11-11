import { DSSA_REPO_URL, TIP_MAX_LENGTH, TIPS_DIR } from './constants';

export interface TipNote {
  /** Lowercase GitHub username, taken from the file name. */
  username: string;
  tip: string;
  fileUrl: string;
}

/**
 * Same rules as .github/workflows/merge-tip.yml. Keep the two in step:
 * one field named "tip", plain text, no links or HTML, length limit.
 */
export function validateTipText(tip: unknown): string | null {
  if (typeof tip !== 'string') return 'The "tip" field must be text.';
  const text = tip.trim();
  if (!text) return 'The tip is empty.';
  if (text.length > TIP_MAX_LENGTH) return `The tip is ${text.length} characters. The limit is ${TIP_MAX_LENGTH}.`;
  if (/[<>]/.test(text)) return 'The tip contains < or >. Plain text only, no HTML.';
  if (/https?:\/\/|www\.|\]\(/i.test(text)) return 'The tip contains a link. Links are not allowed.';
  return null;
}

// Bundled at build time, so every deploy picks up the tips merged before it.
const tipContext = require.context('../../data/tips', false, /^\.\/[^_][^/]*\.json$/);

export function loadTips(): TipNote[] {
  const tips: TipNote[] = [];
  for (const key of tipContext.keys()) {
    const fileName = key.replace(/^\.\//, '');
    const username = fileName.replace(/\.json$/, '').toLowerCase();
    const data = tipContext(key) as { tip?: unknown };
    if (validateTipText(data?.tip) !== null) continue;
    tips.push({
      username,
      tip: String(data.tip).trim(),
      fileUrl: `${DSSA_REPO_URL}/blob/main/${TIPS_DIR}/${fileName}`,
    });
  }
  return tips;
}

export function tipUsernames(): Set<string> {
  return new Set(loadTips().map((t) => t.username));
}
