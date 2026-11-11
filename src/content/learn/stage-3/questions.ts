import type { Question } from '@/lib/learn/types';

/** Each question asks about the build card. */
export const stage3Questions: Question[] = [
  {
    id: 's3-localhost',
    concept: 'Two copies of your site',
    prompt: 'A friend in another dorm wants to see your site. Which address do you send?',
    answer: 'Your .vercel.app address',
    wrong: ['localhost:3000', 'The address of your repo page on GitHub', 'The folder path that pwd shows'],
  },
  {
    id: 's3-push-deploys',
    concept: 'Build card, 5. Watch a push go live',
    prompt: 'In step 5 you pushed, then opened Deployments in Vercel. What did the newest deployment do?',
    answer: 'It went from Building to Ready, and then your live page showed the new line',
    wrong: [
      'It waited until an officer approved it',
      'It stayed at Building until you uploaded the files by hand',
      'It emailed you the code to check',
    ],
  },
  {
    id: 's3-failed-build',
    concept: 'The build',
    prompt:
      'Your .vercel.app page is open on your phone. You push a change with an error like the one you made in step 2, and the build fails on Vercel. What does your phone show when you refresh?',
    answer: 'The last version that built',
    wrong: ['An error page', 'A blank page', 'Your code'],
  },
  {
    id: 's3-local-build',
    concept: 'Build card, 2. Break the build on purpose',
    prompt: 'How do you find out, before you push, whether Vercel will be able to build your change?',
    answer: 'Run npm run build on your laptop and read the last lines',
    wrong: [
      'Push it and wait for Vercel to email you',
      'Run git push twice',
      'Run npm install',
    ],
  },
];
