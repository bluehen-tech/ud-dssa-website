import type { Question } from '@/lib/learn/types';

/** Adapted from the Good Decisions Lane 1 bank for Station 1.2 (Git & GitHub). */
export const stage2Questions: Question[] = [
  {
    id: 's2-git-vs-github',
    concept: 'Git saves versions on your laptop. GitHub keeps a copy online.',
    prompt: 'Which statement is right?',
    answer: 'Git saves versions on your laptop. GitHub keeps a copy of them online.',
    wrong: [
      'GitHub saves the versions. Git is the website that shows them.',
      'Git and GitHub are two names for the same program.',
      'Git is for code. GitHub is for documents.',
    ],
  },
  {
    id: 's2-push',
    concept: 'Six words: push',
    prompt: 'You made a commit. When does it appear on GitHub?',
    answer: 'After you run git push',
    wrong: ['Right away. Commits are always online.', 'After you run git add', 'After you close Cursor'],
  },
  {
    id: 's2-diff-plus',
    concept: 'Reading a diff',
    prompt: 'In a diff, what does a line that starts with + mean?',
    answer: 'The line was added',
    wrong: ['The line was removed', 'The line did not change', 'The line has an error'],
  },
  {
    id: 's2-secret-in-diff',
    concept: 'Secrets are never committed',
    prompt: "The agent's diff puts your database key in page.tsx. What do you do?",
    answer: 'Reject that change. Keys go in .env.local, which is never committed.',
    wrong: [
      'Accept and commit it. The repo is yours.',
      'Accept it, then remove .env.local from .gitignore so the key is saved too.',
      'Push it now and fix it later.',
    ],
  },
  {
    id: 's2-commit-often',
    concept: 'The everyday rhythm: commit after each change that works',
    prompt: 'When should you commit?',
    answer: 'After each small change that works',
    wrong: ['Once, when the project is finished', 'Only when something breaks', 'Once a week'],
  },
];
