import type { Question } from '@/lib/learn/types';

export const stage7Questions: Question[] = [
  {
    id: 's7-fork',
    concept: 'Four words: fork',
    prompt: 'Why do you fork ud-dssa-website instead of pushing to it?',
    answer: 'Only officers can push to it. A fork is your own copy, which you can push to.',
    wrong: [
      'Forking makes the site load faster',
      'Pushing works too. Forking is only a habit.',
      'A fork deletes the original repo',
    ],
  },
  {
    id: 's7-pull-request',
    concept: 'Four words: pull request',
    prompt: 'What is a pull request?',
    answer: "A request to merge your branch into another repo, showing the diff",
    wrong: ['A download of the newest code', 'A message to an officer asking for access', 'A backup of your repo'],
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
