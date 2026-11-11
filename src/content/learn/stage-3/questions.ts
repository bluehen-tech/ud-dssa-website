import type { Question } from '@/lib/learn/types';

export const stage3Questions: Question[] = [
  {
    id: 's3-localhost',
    concept: 'Two copies of your site',
    prompt: 'Who can see your site at localhost:3000?',
    answer: 'Only you, on your laptop',
    wrong: ['Anyone with the link', "Anyone on UD's network", 'Anyone, once you push'],
  },
  {
    id: 's3-push-deploys',
    concept: 'How a push becomes live',
    prompt: 'You push a commit to GitHub. What does Vercel do?',
    answer: 'Builds the new code and puts it live, in a minute or two',
    wrong: [
      'Nothing, until you upload the files by hand',
      'Takes the site down until an officer approves it',
      'Emails you the code to check',
    ],
  },
  {
    id: 's3-failed-build',
    concept: 'The build',
    prompt: 'A build fails on Vercel. What do visitors see?',
    answer: 'The last version that built',
    wrong: ['An error page', 'A blank page', 'Your source code'],
  },
  {
    id: 's3-local-build',
    concept: 'The build: run it on your laptop first',
    prompt: 'Which command runs the same build on your laptop?',
    answer: 'npm run build',
    wrong: ['npm run dev', 'git push', 'npm install'],
  },
  {
    id: 's3-env-on-vercel',
    concept: 'Keys and the live site',
    prompt: 'Your site reaches its database on your laptop, but the live site cannot. What is the likely cause?',
    answer: "The values in .env.local were never added to Vercel's settings",
    wrong: [
      'Vercel does not support databases',
      'The live site needs to be pushed again several times',
      'Your browser is out of date',
    ],
  },
];
