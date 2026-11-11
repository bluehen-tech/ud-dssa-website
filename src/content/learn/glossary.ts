/**
 * Plain definitions for every technical word the Builder Path uses.
 *
 * In a lesson or build card, write [[word]] to make a word tappable. The
 * learner sees this definition. Write definitions for someone who has never
 * coded: one or two short sentences, using only everyday words or words from
 * an earlier stage.
 *
 * `stage` is the stage that teaches the word. That stage's lesson or build
 * card must define it in bold. `strict` marks tool names and other words a
 * newcomer cannot guess. A strict word may not appear in an earlier stage's
 * main text unless it is written as [[word]] or sits inside a :::more block.
 * src/__tests__/learn-content.test.ts enforces both rules.
 */
export interface GlossaryEntry {
  word: string;
  /** Other forms that mean the same thing, such as plurals. */
  aliases?: string[];
  definition: string;
  stage: number;
  strict?: boolean;
}

export const GLOSSARY: GlossaryEntry[] = [
  // Stage 0
  {
    word: 'code',
    definition: 'Text files that tell a computer what to do. A website is made of code.',
    stage: 0,
  },
  {
    word: 'database',
    aliases: ['databases'],
    definition: 'Where a site keeps its data, so the data is still there the next time you visit.',
    stage: 0,
  },

  // Stage 1
  {
    word: 'Cursor',
    definition: 'An app for writing code. It has an AI helper built in.',
    stage: 1,
    strict: true,
  },
  {
    word: 'editor',
    definition: 'An app for reading and changing code files. Cursor is an editor.',
    stage: 1,
  },
  {
    word: 'agent',
    definition: 'The AI helper inside Cursor. You ask for a change in plain words, and it edits your files.',
    stage: 1,
  },
  {
    word: 'terminal',
    definition: 'A window where you type commands and the computer answers in text.',
    stage: 1,
    strict: true,
  },
  {
    word: 'command',
    aliases: ['commands'],
    definition: 'A short line of text that tells the computer to do one thing.',
    stage: 1,
  },
  {
    word: 'Node.js',
    definition: 'A free program that runs the tools a website project needs on your laptop.',
    stage: 1,
    strict: true,
  },

  // Stage 2
  {
    word: 'Git',
    definition: 'A program that saves versions of your project on your laptop.',
    stage: 2,
    strict: true,
  },
  {
    word: 'GitHub',
    definition: 'A website that keeps a copy of your project and its saved versions online.',
    stage: 2,
    strict: true,
  },
  {
    word: 'commit',
    aliases: ['commits'],
    definition: 'One saved version of your project, with a short message that says what changed.',
    stage: 2,
    strict: true,
  },
  {
    word: 'repository',
    aliases: ['repo', 'repos', 'repositories'],
    definition: 'A project folder whose versions Git saves. Often shortened to repo.',
    stage: 2,
    strict: true,
  },
  {
    word: 'push',
    aliases: ['pushes', 'pushed'],
    definition: 'Send your new commits from your laptop to GitHub.',
    stage: 2,
  },
  {
    word: 'clone',
    definition: 'Download a copy of a repo to your laptop, with its history.',
    stage: 2,
  },
  {
    word: 'diff',
    aliases: ['diffs'],
    definition: 'The lines that changed between two versions. Removed lines start with -. Added lines start with +.',
    stage: 2,
    strict: true,
  },
  {
    word: 'key',
    aliases: ['keys'],
    definition: 'A long password that lets a site use a service, such as its database. Keys stay private.',
    stage: 2,
  },
  {
    word: '.env.local',
    definition: 'A file on your laptop that holds your keys. Git never saves it.',
    stage: 2,
  },
  {
    word: '.gitignore',
    definition: 'A file that lists what Git must never save.',
    stage: 2,
  },
  {
    word: 'npm',
    definition: 'A tool that comes with Node.js. It downloads the code a project depends on and runs project commands.',
    stage: 2,
    strict: true,
  },
  {
    word: 'localhost',
    definition: 'The address of a site running on your own laptop. Only you can open it.',
    stage: 2,
    strict: true,
  },

  // Stage 3
  {
    word: 'production',
    definition: 'The live copy of a site, which anyone can open on the web.',
    stage: 3,
    strict: true,
  },
  {
    word: 'Vercel',
    definition: 'A service that puts a site on the web. It updates the live site each time you push to GitHub.',
    stage: 3,
    strict: true,
  },
  {
    word: 'deploy',
    aliases: ['deploys', 'deployed'],
    definition: 'Put a new version of a site live.',
    stage: 3,
    strict: true,
  },
  {
    word: 'build',
    definition: 'The step that turns your code into the files a browser needs. If it fails, the live site does not change.',
    stage: 3,
  },

  // Stage 4
  {
    word: 'Next.js',
    definition: 'A toolkit for building websites. It turns files in your project into pages.',
    stage: 4,
    strict: true,
  },
  {
    word: 'component',
    aliases: ['components'],
    definition: 'A piece of a page that you write once and use many times, such as a member card.',
    stage: 4,
    strict: true,
  },
  {
    word: 'props',
    definition: 'The details you give a component, such as a name or a photo.',
    stage: 4,
    strict: true,
  },
  {
    word: 'Tailwind CSS',
    aliases: ['Tailwind'],
    definition: 'A way to set how a page looks with short words called classes, such as font-bold.',
    stage: 4,
    strict: true,
  },
  {
    word: 'class',
    aliases: ['classes'],
    definition: 'A short word that sets one part of how something looks. For example, font-bold makes text bold.',
    stage: 4,
  },

  // Stage 5
  {
    word: 'table',
    aliases: ['tables'],
    definition: 'Data in a database, arranged in rows and columns like one tab of a spreadsheet.',
    stage: 5,
  },
  {
    word: 'row',
    aliases: ['rows'],
    definition: 'One record in a table. Your portfolio is one row.',
    stage: 5,
  },
  {
    word: 'Supabase',
    definition: 'A service that runs a database for your site. It also handles sign-in and keeps files.',
    stage: 5,
    strict: true,
  },
  {
    word: 'server',
    definition: "A computer on the web that runs a site's code and answers each visitor's browser.",
    stage: 5,
  },
  {
    word: 'API route',
    aliases: ['API routes'],
    definition: 'Code that runs on the server. A page sends it a request. It checks the request, then reads or saves data.',
    stage: 5,
    strict: true,
  },
  {
    word: 'environment variable',
    aliases: ['environment variables'],
    definition: 'A named setting kept outside your code, such as a key. The code reads it by name.',
    stage: 5,
    strict: true,
  },
  {
    word: 'SQL',
    definition: 'The language used to give instructions to a database, such as "create a table".',
    stage: 5,
    strict: true,
  },

  // Stage 6
  {
    word: 'session',
    definition: "The site's record that you are signed in. On bluehen-dssa.org it lasts four hours.",
    stage: 6,
  },
  {
    word: 'middleware',
    definition: 'Code that runs before a page opens. On bluehen-dssa.org it checks that you are signed in.',
    stage: 6,
    strict: true,
  },
  {
    word: 'row-level security',
    definition: 'Rules inside the database that decide who can read or change each row.',
    stage: 6,
    strict: true,
  },
  {
    word: 'Supabase Storage',
    definition: 'The part of Supabase that keeps files, such as photos and resumes.',
    stage: 6,
    strict: true,
  },
  {
    word: 'Resend',
    definition: 'A service that sends email for a site.',
    stage: 6,
    strict: true,
  },

  // Stage 7
  {
    word: 'fork',
    aliases: ['forks'],
    definition: "Your own copy of someone else's repo, on your GitHub account. You can push to it.",
    stage: 7,
    strict: true,
  },
  {
    word: 'branch',
    aliases: ['branches'],
    definition: 'A separate line of commits. You change things on a branch so the main line stays untouched.',
    stage: 7,
    strict: true,
  },
  {
    word: 'pull request',
    aliases: ['pull requests'],
    definition: 'A request to add your changes to a repo. It shows the diff and has room for comments.',
    stage: 7,
    strict: true,
  },
  {
    word: 'merge',
    aliases: ['merges', 'merged'],
    definition: 'Add the commits from one branch into another.',
    stage: 7,
    strict: true,
  },
  {
    word: 'checks',
    definition: 'Automatic tests that run on a pull request and pass or fail.',
    stage: 7,
  },
  {
    word: 'GitHub Action',
    aliases: ['GitHub Actions'],
    definition: 'An automatic job that GitHub runs when something happens in a repo, such as a new pull request.',
    stage: 7,
    strict: true,
  },
  {
    word: 'JSON',
    definition: 'A plain text format for data. Each value has a name, and the whole thing sits inside curly braces.',
    stage: 7,
    strict: true,
  },
];

const BY_NAME = new Map<string, GlossaryEntry>();
for (const entry of GLOSSARY) {
  for (const name of [entry.word, ...(entry.aliases ?? [])]) {
    BY_NAME.set(name.toLowerCase(), entry);
  }
}

/** Finds a glossary entry by its word or any alias, ignoring capital letters. */
export function findWord(text: string): GlossaryEntry | undefined {
  return BY_NAME.get(text.trim().toLowerCase());
}

export function wordsForStage(stageId: number): GlossaryEntry[] {
  return GLOSSARY.filter((entry) => entry.stage === stageId);
}
