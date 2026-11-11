# Builder Path voice guide

Every lesson, quiz question, quiz feedback line, build card, the handout, and the instruction files in the starter repo follow these rules. Check new text against this list before you merge it.

## Who you are writing for

A first-year student who has never coded. They have not heard of Supabase, Vercel, Git or any other tool on the path. Assume nothing except that they can use a laptop and a browser.

## Rules

1. Short sentences and plain words. Address the learner as "you".
2. Say what a thing does before you say its name. "A service called Vercel puts your site on the web" works. "Vercel deploys your site" does not.
3. Do not use a tool name or technical word before the stage that teaches it. Describe the job instead: "the site emailed you a code", not "Supabase sent an OTP". If an early stage must name a later word, write it as `[[word]]` or put it in a `:::more` block.
4. Explain with an example from bluehen-dssa.org, not a comparison to something else. Use a comparison only when the plain statement fails. At most one per lesson.
5. Prefer periods, commas and colons. At most one em-dash per lesson.
6. Bold a word where it is defined: once in the short version and once in its section. Add it to `glossary.ts`. Keep each stage's new words to a short list.
7. Use the "Do this now" pattern: one action, then how to confirm it worked.
8. Never write "don't use AI". Say what the learner must be able to do or explain themselves.
9. No filler and no hype. Leave out "simply", "just", "easy", "powerful" and "exciting".

## Three layers

A lesson has three layers, so a newcomer is not buried and someone who knows the topic can move on.

1. **The short version.** A `:::short` block at the top: three or four plain lines that state the ideas. A learner who knows them goes straight to the concept check.
2. **The main text.** One idea per section. Everything the concept check asks is here.
3. **Optional detail.** `:::more` blocks, closed until the learner opens them: file names, code, background, troubleshooting. The concept check never asks about these.

## Lesson format

Lessons and build cards are markdown, plus three additions:

```
:::short
- One idea per line.
:::

:::more The title the learner clicks
Any markdown, including code and tables.
:::

A [[word]] from glossary.ts shows its plain definition when tapped.
```

Leave a blank line before and after each block. Blocks cannot sit inside each other.

Use `[[word]]` the first time a lesson or build card uses a word from an earlier stage. Do not mark the word in the stage that teaches it. Define it in bold there instead.

## Sample at the target length and tone

> **Git** saves versions of your project on your laptop. Each saved version is a **commit**. **GitHub** is a website that keeps a copy of your commits online.
>
> Do this now: open a new terminal and run `git --version`. You should see a version number.

## Quick check before you merge

- Run `npm test`. It fails when a lesson uses a word before its stage, marks a word that has no definition, or leaves a block open.
- Can each sentence be read once and understood?
- Does the short version state every idea the concept check asks about?
- Is anything the concept check asks about hidden inside a `:::more` block? Move it out.
- Does each "Do this now" say how the learner knows it worked?
- Read it as someone who has never heard of the tools. Does any sentence lean on a word they have not met?
