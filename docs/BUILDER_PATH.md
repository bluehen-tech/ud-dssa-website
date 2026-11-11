# Builder Path: officer guide

The Builder Path at [bluehen-dssa.org/learn](https://bluehen-dssa.org/learn) is a self-paced beginner route into the DSSA stack. It opens once a member's portfolio is published with a photo. Each stage has a short lesson, a concept check, and a build card that unlocks when the check passes. Stage 7 ends with a pull request that adds one tip to the site, and that pull request merges on its own.

Officers have no required step. Your work is watching and upkeep.

## One-time setup

1. **Database.** In the Supabase SQL Editor, run [`supabase/BUILDER_PATH_SETUP.sql`](../supabase/BUILDER_PATH_SETUP.sql). It creates `learn_progress`, `learn_attempts` and `learn_profiles` with row-level security. It is safe to run again.
2. **Service-role key.** The path writes through the service-role client. Check that `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel. It already is if `/admin` works.
3. **Tip merge time (optional).** The Beginner Tips page lists the newest tips first using a time the merge workflow records. To turn this on, make a long random string and save it in two places with the same value:
   - GitHub: **Settings > Secrets and variables > Actions > New repository secret**, named `TIPS_WEBHOOK_SECRET`.
   - Vercel: **Settings > Environment Variables**, named `TIPS_WEBHOOK_SECRET`. Redeploy.

   Without it, tips still merge and show, sorted by username.
4. **Test tip.** Before the first Builders Day, have one officer walk Stage 7 with a test account and open a real tip pull request. Confirm that the Action merges it and that Vercel deploys the merge. Each merged tip is a commit authored by a learner, so this checks that your Vercel plan deploys commits from people outside the team.

Already checked (November 2026): `main` has no branch protection or rulesets, so the Action can merge. If you add a rule that requires a review, give the GitHub Actions bot an exception or tips will stop merging.

## Where things live

| What | Where |
| --- | --- |
| Voice rules for all path text | `src/content/learn/VOICE.md` |
| Stage list, titles, "last checked" dates | `src/content/learn/stages.ts` |
| Lesson and build card for a stage | `src/content/learn/stage-N/lesson.md` and `build.md` |
| Concept check questions | `src/content/learn/stage-N/questions.ts` |
| Tips | `src/data/tips/<github-username>.json` |
| Tip merge workflow | `.github/workflows/merge-tip.yml` |
| Path pages | `src/app/learn/` |
| Printable handout | [/builders-day/handout](https://bluehen-dssa.org/builders-day/handout) |

## Edit a lesson

1. Open the stage's `lesson.md` or `build.md`. They are plain markdown.
2. Follow `VOICE.md`: short sentences, plain words, at most one metaphor and one em-dash per lesson, and a "Do this now" line that says how the learner knows it worked.
3. If you walked through the build card yourself, update that stage's `lastChecked` date in `stages.ts`. The date shows at the bottom of each build card and in `/admin`.
4. Open a pull request as usual. Lesson changes are reviewed by an officer. Only tip files merge on their own.

`{{githubUsername}}` in a lesson or build card is replaced with the learner's saved GitHub username.

## Edit a concept check

Each question in `questions.ts` has an `id`, a `concept`, a `prompt`, one `answer` and three `wrong` choices. Choices are shuffled for each learner.

- The `concept` is what a learner sees when they miss the question. Name the lesson section to reread.
- A learner must answer every question correctly to pass. Keep each check to 3 to 5 questions.
- Keep an `id` the same when you reword a question, so its miss count in `/admin` carries over. Use a new `id` for a new question.

Answers are readable in the public repo. That is fine: the path is not for credit.

## Read the admin view

The Builder Path section at the bottom of [/admin](https://bluehen-dssa.org/admin) shows:

- **Learners at each stage.** The stage each learner is working on now, plus how many have finished. Each box also shows when that stage's steps were last checked.
- **Learners.** Name, current stage, last activity, GitHub username, and the tip block switch.
- **Most-missed questions.** The ten questions missed most often. A question near the top usually means its lesson section is unclear.
- **Recent tips.** The newest tips with a link to each file on GitHub.

Problems learners hit are reported with the "Report a problem with this step" link on each build card. These open GitHub issues labeled `builder-path`. Create that label once in **Issues > Labels** if it does not exist.

## Remove a tip

Delete the tip's file on GitHub: open the file from **Recent tips** in `/admin`, click the trash icon, and commit to `main`. The tip and the author's Contributor badge are gone after the next deploy.

A deleted tip could be submitted again. To stop that, block the learner.

## Block a learner

In `/admin`, find the learner and click **Allowed. Block**. Their tip pull requests then fail the eligibility check, stay open, and wait for an officer. Click **Blocked. Allow** to undo.

## How the tip merge works

The workflow runs on `pull_request_target` when a pull request touches `src/data/tips/`. It merges only when:

- the pull request changes exactly one file, in `src/data/tips/`;
- the file name is the author's GitHub username plus `.json`, ignoring capital letters;
- the file is JSON with only a `tip` field: plain text, 200 characters at most, no links, no HTML;
- `GET /api/learn/eligible?username=<author>` says the author saved that username, passed the Stage 7 check, and is not blocked.

It reads the file through the GitHub API and never checks out or runs code from the pull request. Do not add a checkout step to this workflow. A failed check leaves the pull request open with a comment naming the reason.

The same tip rules are in `validateTipText` in `src/lib/learn/tips.ts`. If you change one, change the other.

## Trial checklist for a Builders Day

Use this the first few times the path is handed out.

Before:

- [ ] Print the handout from `/builders-day/handout`.
- [ ] Walk Stages 0 to 2 on a Windows laptop and a Mac. Update `lastChecked` dates.
- [ ] Check Cursor's current free plan and any student offer, and update the Stage 1 lesson if it changed.

During:

- [ ] Note where each newcomer stops and why. Write down the exact step.
- [ ] Note any word a newcomer asks about. It may need a definition in the lesson.
- [ ] Time Stage 1 and Stage 2. The target is under an hour each.

After:

- [ ] Read the most-missed questions in `/admin`.
- [ ] Fix the lessons and build cards that caused the stops, following `VOICE.md`.
- [ ] Read new `builder-path` issues.
