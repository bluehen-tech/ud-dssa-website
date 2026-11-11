export const DSSA_REPO_URL = 'https://github.com/bluehen-tech/ud-dssa-website';
export const STARTER_REPO_URL = 'https://github.com/bluehen-tech/dssa-starter';
export const LEARN_SHORT_URL = 'bluehen-dssa.org/learn';
export const LEARN_FULL_URL = 'https://bluehen-dssa.org/learn';

export const TIP_MAX_LENGTH = 200;
export const TIPS_DIR = 'src/data/tips';

/** GitHub usernames: letters, numbers and single hyphens, 1 to 39 characters. */
export const GITHUB_USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i;

export function reportProblemUrl(stageId: number, stageTitle: string): string {
  const title = `Builder Path Stage ${stageId}: problem with a step`;
  const body = [
    `Stage: ${stageId}, ${stageTitle}`,
    '',
    'Which step did not work?',
    '',
    'What did you see? (Paste the exact error message if there was one.)',
    '',
    'Windows or Mac?',
  ].join('\n');
  const params = new URLSearchParams({ title, body, labels: 'builder-path' });
  return `${DSSA_REPO_URL}/issues/new?${params.toString()}`;
}
