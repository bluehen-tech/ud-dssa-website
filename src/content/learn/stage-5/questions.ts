import type { Question } from '@/lib/learn/types';

/** Each question asks about the build card. */
export const stage5Questions: Question[] = [
  {
    id: 's5-row',
    concept: 'Tables and rows',
    prompt: 'Three people submit your sign-up form. What do you see when you open signups in Table Editor?',
    answer: 'Three new rows, one per person, each with a name and an email',
    wrong: ['Three new tables', 'One row with all three names in it', 'Three new columns'],
  },
  {
    id: 's5-api-route',
    concept: 'API routes',
    prompt:
      'Your signup route checks that the email contains @ before it saves a row. Why is that check in the route and not only in the form on the page?',
    answer: 'The route runs on the server, where a visitor cannot change it',
    wrong: [
      'A page cannot check what people type',
      'Checks in an API route make the form load faster',
      'Vercel puts only API routes live',
    ],
  },
  {
    id: 's5-env',
    concept: 'Environment variables',
    prompt: 'Your form adds a row on localhost, but fails on your live site. What is the likely cause?',
    answer: "The two values from .env.local were never added to Vercel's environment variable settings",
    wrong: [
      'Supabase does not accept forms from live sites',
      'You need to push the same commit again',
      'Your browser is out of date',
    ],
  },
  {
    id: 's5-restart',
    concept: 'Build card, 3. Add your keys',
    prompt: 'You paste your keys into .env.local while the site is running. The form still fails on localhost. What do you try first?',
    answer: 'Stop the site with Ctrl+C and start it again with npm run dev',
    wrong: ['Commit .env.local so the site can find it', 'Paste the keys into page.tsx', 'Delete the signups table'],
  },
  {
    id: 's5-paused',
    concept: 'Paused projects',
    prompt: 'Your sign-up form worked last month. Today it fails, and Supabase shows the project as paused. What do you do?',
    answer: 'Restore the project in the Supabase dashboard',
    wrong: ['Delete the repo and start over', 'Create a new Vercel account', 'Wait. It restores itself next month.'],
  },
];
