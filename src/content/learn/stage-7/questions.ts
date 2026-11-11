import type { Question } from '@/lib/learn/types';

/** Each question asks about the build card. Answer them after your tip pull request. */
export const stage7Questions: Question[] = [
  {
    id: 's7-fork',
    concept: 'Four words',
    prompt: 'In Stage 6 you cloned bluehen-tech/ud-dssa-website. Why could you not push your tip from that copy?',
    answer: 'Only officers can push to that repo. You push to your fork instead.',
    wrong: [
      'You could. Forking is only a habit.',
      'A cloned copy cannot be changed',
      'Your tip was too long',
    ],
  },
  {
    id: 's7-branch',
    concept: 'Build card, 1. Practice in your own repo',
    prompt: 'You pushed the practice-pr branch and opened a pull request, but had not merged it. Had your live site changed?',
    answer: 'No. The change was on a branch. Vercel puts main live, and main changed only when you merged.',
    wrong: [
      'Yes. Every push goes live right away.',
      'Yes, but only on your phone',
      'No, because Vercel stops while a pull request is open',
    ],
  },
  {
    id: 's7-pull-request',
    concept: 'Four words: pull request',
    prompt: 'When you opened your practice pull request, what did the Files changed tab show?',
    answer: 'The diff: the lines your branch changes',
    wrong: ['Every file in the repo', 'A list of people allowed to merge', 'Your commit messages, with no code'],
  },
  {
    id: 's7-fix-failed-check',
    concept: 'What happens after you open the pull request',
    prompt: 'The Action comments that your file name does not match your username. What do you do?',
    answer: 'Rename the file to your GitHub username plus .json, commit, and push to the same branch',
    wrong: [
      'Make a new fork and start over',
      'Ask an officer to rename it for you',
      'Close the pull request and wait',
    ],
  },
  {
    id: 's7-valid-tip',
    concept: 'Your contribution: one tip',
    prompt: 'Which tip file passes the checks?',
    answer: '{ "tip": "Read every diff before you accept it." }',
    wrong: [
      '{ "tip": "See https://example.com for help." }',
      '{ "tip": "Commit often.", "name": "Jordan" }',
      '{ "tip": "<b>Commit often.</b>" }',
    ],
  },
];
