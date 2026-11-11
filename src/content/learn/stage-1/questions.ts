import type { Question } from '@/lib/learn/types';

/** Adapted from the Good Decisions Lane 1 bank for Station 1.1 (Your Toolkit). */
export const stage1Questions: Question[] = [
  {
    id: 's1-agent-panel',
    concept: 'The four parts of the Cursor window',
    prompt: 'In Cursor, where do you ask the AI for a change?',
    answer: 'The agent panel',
    wrong: ['The file explorer', 'The editor', 'The terminal'],
  },
  {
    id: 's1-pwd',
    concept: 'Four terminal commands',
    prompt: 'Which terminal command shows the folder you are in?',
    answer: 'pwd',
    wrong: ['ls', 'cd', 'mkdir'],
  },
  {
    id: 's1-read-the-diff',
    concept: 'Working with the agent: read what changed',
    prompt:
      'You ask the agent to fix a typo on your home page. Its changes also edit three other files. What do you do?',
    answer: 'Ask why it changed the other files before you accept anything',
    wrong: [
      'Accept all of it. The agent knows the project better than you do',
      'Reinstall Cursor and ask again',
      'Delete the three other files',
    ],
  },
  {
    id: 's1-small-request',
    concept: 'Working with the agent: one small change at a time',
    prompt: 'Which request to the agent follows this lesson?',
    answer: 'Add my name to the home page',
    wrong: ['Build my whole website', 'Make my site look professional', 'Add every page I might need'],
  },
  {
    id: 's1-local-folder',
    concept: 'Keep projects in a plain folder',
    prompt: 'Where should you keep your project folder?',
    answer: 'In a folder on your laptop, such as code in your home folder',
    wrong: [
      'In OneDrive, so it is backed up',
      'In Google Drive, so you can share it',
      'In iCloud Drive, so it is on all your devices',
    ],
  },
];
