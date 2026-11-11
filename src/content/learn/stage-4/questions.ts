import type { Question } from '@/lib/learn/types';

export const stage4Questions: Question[] = [
  {
    id: 's4-file-to-route',
    concept: 'Files are pages',
    prompt: 'Which file makes the page at /events?',
    answer: 'src/app/events/page.tsx',
    wrong: ['src/events.tsx', 'src/app/page.tsx', 'public/events.html'],
  },
  {
    id: 's4-component-props',
    concept: 'Components and props',
    prompt: 'Every card on the DSSA members page has the same layout but shows a different person. Why?',
    answer: 'Each card is the same component, given different props',
    wrong: [
      'An officer builds each card by hand',
      'Each card is a separate page',
      "Each member's photo sets the layout",
    ],
  },
  {
    id: 's4-tailwind',
    concept: 'Tailwind CSS',
    prompt: 'What does the Tailwind class font-bold do?',
    answer: 'Makes text bold',
    wrong: ['Makes text larger', 'Changes the font to a new one', 'Makes text blue'],
  },
  {
    id: 's4-data-file',
    concept: 'Lists in a data file',
    prompt: 'You want to add a fourth event to your events page. Where do you make the change?',
    answer: 'Add it to the list in src/data/events.ts',
    wrong: ['Copy the events page and edit the copy', 'Add it to .env.local', 'Add it to the README'],
  },
];
