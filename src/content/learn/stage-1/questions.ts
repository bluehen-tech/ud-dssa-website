import type { Question } from '@/lib/learn/types';

/** Adapted from the Good Decisions Lane 1 bank for Station 1.1 (Your Toolkit). Each question asks about the build card. */
export const stage1Questions: Question[] = [
  {
    id: 's1-agent-panel',
    concept: 'The four parts of the Cursor window',
    prompt: 'In step 6 you asked the agent what folder was open. Where in the window did you type that question?',
    answer: 'The agent panel, on the right',
    wrong: ['The file explorer, on the left', 'The editor, in the middle', 'The terminal, at the bottom'],
  },
  {
    id: 's1-pwd',
    concept: 'Build card, 5. Try the four commands',
    prompt: 'You typed mkdir practice, then cd practice, then pwd. How did the answer to pwd end?',
    answer: 'With practice',
    wrong: ['With code', 'With mkdir', 'It showed an error, because pwd only works in the code folder'],
  },
  {
    id: 's1-read-the-diff',
    concept: 'Working with the agent: read what changed',
    prompt:
      'You ask the agent to create hello.txt in your practice folder. Its change also edits two other files you did not mention. What do you do?',
    answer: 'Ask why it changed the other files before you keep anything',
    wrong: [
      'Keep all of it. The agent knows the project better than you do',
      'Reinstall Cursor and ask again',
      'Delete the two other files yourself',
    ],
  },
  {
    id: 's1-small-request',
    concept: 'Working with the agent: one small change at a time',
    prompt: 'You want a list of your classes in the practice folder. Which request can you check in a minute once the agent finishes?',
    answer: 'Create classes.txt in the practice folder with my three classes, one per line. Change nothing else.',
    wrong: [
      'Organize all my school files',
      'Make my practice folder look professional',
      'Build everything I might need this semester',
    ],
  },
  {
    id: 's1-local-folder',
    concept: 'Keep projects in a plain folder',
    prompt:
      "A classmate's project keeps breaking while the agent edits it. pwd shows C:\\Users\\sam\\OneDrive\\code. What do you tell them?",
    answer: 'Move the project to a code folder that is not inside OneDrive',
    wrong: ['Install Node.js again', 'Restart the laptop before each change', 'Ask the agent to fix each error as it appears'],
  },
];
