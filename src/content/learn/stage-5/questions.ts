import type { Question } from '@/lib/learn/types';

export const stage5Questions: Question[] = [
  {
    id: 's5-row',
    concept: 'Tables and rows',
    prompt: 'On bluehen-dssa.org, what is your portfolio in the database?',
    answer: 'One row in the member_portfolios table',
    wrong: ['A separate table just for you', 'A file in the GitHub repo', 'One column in every table'],
  },
  {
    id: 's5-api-route',
    concept: 'API routes',
    prompt: 'Why does the Get Connected form send its data to an API route?',
    answer: 'The route runs on the server, where it checks the data before saving a row',
    wrong: [
      'Browsers cannot send data anywhere else',
      'API routes make the page load faster',
      'API routes change how the form looks',
    ],
  },
  {
    id: 's5-env',
    concept: 'Environment variables',
    prompt: 'Where does your Supabase key go?',
    answer: "In .env.local on your laptop, and in Vercel's environment variable settings",
    wrong: ['In page.tsx, so the page can find it', 'In the README', 'In a commit message'],
  },
  {
    id: 's5-paused',
    concept: 'Paused projects',
    prompt: 'Your sign-up form worked last month. Today it fails, and Supabase shows the project as paused. What do you do?',
    answer: 'Restore the project in the Supabase dashboard',
    wrong: ['Delete the repo and start over', 'Create a new Vercel account', 'Wait. It restores itself next month.'],
  },
];
