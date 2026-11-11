import type { Question } from '@/lib/learn/types';

export const stage6Questions: Question[] = [
  {
    id: 's6-sign-in',
    concept: 'Tour 1: Sign-in',
    prompt: 'When you sign in to bluehen-dssa.org, what proves the @udel.edu address is yours?',
    answer: 'You type a code that was emailed to that inbox',
    wrong: ['A password stored on the site', 'An officer checks your name', 'Your portfolio photo'],
  },
  {
    id: 's6-middleware',
    concept: 'Tour 1: Sign-in',
    prompt: 'What keeps a signed-out visitor from opening /members/me?',
    answer: 'middleware.ts checks for a session and sends them to the login page',
    wrong: ['The page is hidden from the menu', 'GitHub blocks the address', 'Vercel asks for a password'],
  },
  {
    id: 's6-rls',
    concept: 'Tour 2: Row-level security',
    prompt: 'Row-level security on member_portfolios lets you read your own draft but not anyone else\'s. Where does this rule run?',
    answer: 'In the database, so it holds even if a page has a bug',
    wrong: ['Only in the page\'s buttons', 'In your browser settings', 'On GitHub'],
  },
  {
    id: 's6-storage',
    concept: 'Tour 3: File storage',
    prompt: 'Where is your portfolio photo kept?',
    answer: "In Supabase Storage. Your row stores the photo's address.",
    wrong: ['Inside your database row, as an image', 'In the GitHub repo', 'In your browser'],
  },
  {
    id: 's6-resend',
    concept: 'Tour 4: Email',
    prompt: 'What does Resend do for the DSSA site?',
    answer: 'Sends email, including sign-in codes and club emails',
    wrong: ['Puts the site on the web', 'Stores member photos', 'Checks concept check answers'],
  },
];
