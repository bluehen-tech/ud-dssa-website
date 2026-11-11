import type { Question } from '@/lib/learn/types';

/** Adapted from the Good Decisions Lane 1 bank for Station 1.2 (Git & GitHub). Each question asks about the build card. */
export const stage2Questions: Question[] = [
  {
    id: 's2-git-vs-github',
    concept: 'Why save versions',
    prompt: 'You lose your laptop the day after you pushed. What can you get back from GitHub?',
    answer: 'Every commit you pushed',
    wrong: [
      'Nothing. Git kept the project on your laptop only',
      'Only the last file you changed',
      'Everything, including changes you never committed',
    ],
  },
  {
    id: 's2-push',
    concept: 'Build card, 8. Make your first commit',
    prompt: 'In step 8 you made a commit, then refreshed GitHub before you pushed. Why was your commit not there?',
    answer: 'A commit stays on your laptop until you push it',
    wrong: [
      'GitHub takes about an hour to show new commits',
      'The commit did not save',
      'GitHub shows only the first commit in a repo',
    ],
  },
  {
    id: 's2-diff-plus',
    concept: 'Reading a diff',
    prompt: 'A diff shows these two lines. What changed?\n-  <h1>Your name here</h1>\n+  <h1>Jordan Lee</h1>',
    answer: 'The heading changed from Your name here to Jordan Lee',
    wrong: [
      'The heading changed from Jordan Lee to Your name here',
      'A second heading was added, and both now show',
      'Nothing changed. The diff lists both lines for comparison',
    ],
  },
  {
    id: 's2-secret-in-diff',
    concept: 'Secrets are never committed',
    prompt: "The agent's diff puts your database key in one of your page files. What do you do?",
    answer: 'Reject that change. Keys go in .env.local, which is never committed.',
    wrong: [
      'Accept and commit it. The repo is yours.',
      'Accept it, then remove .env.local from .gitignore so the key is saved too.',
      'Push it now and fix it later.',
    ],
  },
  {
    id: 's2-commit-often',
    concept: 'Why save versions',
    prompt: 'You make three changes and commit after each one. The third change breaks your site. What can you do because you committed?',
    answer: 'Go back to the second commit, the last version that worked',
    wrong: [
      'Nothing. You undo the third change from memory',
      'Start over from the template',
      'Delete the repo and clone it again',
    ],
  },
];
