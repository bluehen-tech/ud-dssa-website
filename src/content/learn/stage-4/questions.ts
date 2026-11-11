import type { Question } from '@/lib/learn/types';

/** Each question asks about the build card. */
export const stage4Questions: Question[] = [
  {
    id: 's4-file-to-route',
    concept: 'Files are pages',
    prompt: 'You want a page at localhost:3000/about. What do you add?',
    answer: 'A folder named about inside src/app, with a page.tsx file in it',
    wrong: [
      'A file named about.tsx in the public folder',
      'A new line at the end of src/app/page.tsx',
      'A folder named about inside src/components',
    ],
  },
  {
    id: 's4-component-props',
    concept: 'Components',
    prompt: 'You want a second card on your home page, for a friend. What do you add?',
    answer: "A second <MemberCard line on the home page, with your friend's details as its props",
    wrong: [
      "A copy of MemberCard.tsx named FriendCard.tsx, with your friend's details typed inside it",
      'A new page at /friend',
      'A second photo named me.jpg',
    ],
  },
  {
    id: 's4-tailwind',
    concept: 'Styling with Tailwind CSS',
    prompt: 'In step 3 you deleted one class from your card. What happens if you delete font-bold from a heading?',
    answer: 'The heading is no longer bold. Nothing else changes.',
    wrong: ['The heading disappears', 'The whole page loses its colors', 'The build fails'],
  },
  {
    id: 's4-data-file',
    concept: 'Lists in a data file',
    prompt: 'In step 5 you changed an event title in events.ts. Now you want a fourth event. Where do you add it?',
    answer: 'To the list in src/data/events.ts',
    wrong: ['In a copy of the events page', 'In .env.local', 'In the README'],
  },
];
