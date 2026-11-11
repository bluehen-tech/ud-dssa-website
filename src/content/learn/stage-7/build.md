The steps below use your GitHub username, **{{githubUsername}}**. If that is wrong, change it in the box at the end of this card.

## 1. Practice in your own repo

In Cursor, open `my-dssa-site`. In the [[terminal]]:

```
git switch -c practice-pr
```

This makes a new branch named `practice-pr` and moves you onto it.

Ask the agent for one small change, such as "Change the footer text to my name. Change nothing else." Read the diff, then:

```
git add -A
git commit -m "Change footer text"
git push -u origin practice-pr
```

On your repo page on GitHub, click **Compare & pull request**, then **Create pull request**. Read the diff on the **Files changed** tab.

Do this now: before you merge, open your `.vercel.app` site. The footer has not changed. Your change is on the `practice-pr` branch, and Vercel puts `main` live.

Then click **Merge pull request**.

Back in the terminal:

```
git switch main
git pull
```

The first line moves you back to `main`. The second downloads the merged change from GitHub.

Do this now: wait a minute or two, then refresh your `.vercel.app` site. The footer change should now be live.

## 2. Fork the DSSA repo

Open [github.com/bluehen-tech/ud-dssa-website](https://github.com/bluehen-tech/ud-dssa-website) and click **Fork**, then **Create fork**.

In Cursor's terminal, go to your `code` folder and clone your fork. If you cloned the DSSA repo in Stage 6, use a new folder name:

```
git clone https://github.com/{{githubUsername}}/ud-dssa-website.git my-dssa-fork
```

Open `code/my-dssa-fork` in Cursor.

## 3. Add your tip

```
git switch -c add-tip
```

Copy the template to a file named with your username:

- **Windows:** `Copy-Item src/data/tips/_template.json src/data/tips/{{githubUsername}}.json`
- **Mac:** `cp src/data/tips/_template.json src/data/tips/{{githubUsername}}.json`

Open `src/data/tips/{{githubUsername}}.json` in the editor. Replace the sentence with your own tip. Write something you wish you had known at Stage 1. Keep it to 200 characters, with no links.

Write this one yourself. The tip is your contribution.

## 4. Open the pull request

```
git add -A
git commit -m "Add a beginner tip from {{githubUsername}}"
git push -u origin add-tip
```

On your fork's page on GitHub, click **Compare & pull request**. Check that the base repository is `bluehen-tech/ud-dssa-website` and the base branch is `main`. Click **Create pull request**.

Do this now: wait about a minute and refresh the pull request page. The Action leaves a comment.

## 5. If a check fails

Read the comment. It names the problem. Fix the file in Cursor, then:

```
git add -A
git commit -m "Fix my tip"
git push
```

The checks run again on the same pull request.

## Done when

- [ ] Your live site stayed the same until you merged the practice pull request
- [ ] You merged a practice pull request in your own repo
- [ ] The Action merged your tip pull request
- [ ] Your tip is on the [Beginner Tips](/learn/tips) page
- [ ] Your [member card](/members) shows Contributor
