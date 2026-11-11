import type { Question } from '@/lib/learn/types';

/** Each question asks about the tours and the code found in the build card. */
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
    prompt: 'Your session has ended, and you open bluehen-dssa.org/learn. What happens, and which file makes it happen?',
    answer: 'You are sent to the login page, by middleware.ts',
    wrong: [
      'The page opens with no stages, by src/app/learn/page.tsx',
      'Vercel shows an error page',
      'GitHub asks you to sign in',
    ],
  },
  {
    id: 's6-rls',
    concept: 'Tour 2: Row-level security',
    prompt:
      "A page on the site has a bug: it asks the database for every member's portfolio, drafts included. What does a signed-in member get back?",
    answer: "The published portfolios and their own draft. The database's rules hold back everyone else's drafts.",
    wrong: [
      'Every draft, because the page asked for them',
      'Nothing. The whole site stops working',
      'An error from GitHub',
    ],
  },
  {
    id: 's6-storage',
    concept: 'Tour 3: File storage',
    prompt: 'In the photo upload code you found, the file is uploaded first. What is then saved in your portfolio row?',
    answer: "The photo's web address",
    wrong: ['The photo file itself', 'Your GitHub username', 'Nothing. The row does not change'],
  },
  {
    id: 's6-resend',
    concept: 'Tour 4: Email',
    prompt: 'The Resend call you found sends a key with each message. Where does the code get that key?',
    answer: 'From an environment variable set on Vercel. The key is not in the repo.',
    wrong: [
      'From a line typed into the route file',
      "From an officer's GitHub account",
      'From your sign-in code',
    ],
  },
];
