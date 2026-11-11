# Your first pull request

:::short
- Only officers can change the DSSA site's code directly. Everyone else suggests a change.
- You make your own copy of the code, change it there, and ask for the change to be added. That ask is a **pull request**.
- Your change is one small file: a tip for beginners.
- An automatic check reads your pull request and adds your tip to the site if the file follows the rules.
:::

## Four words

- **fork**: your own copy of someone else's [[repo]], on your GitHub account. You can [[push]] to your fork.
- **branch**: a separate line of [[commits]]. A repo's main line is named `main`. You make a change on a branch, so `main` is not touched until the change is accepted.
- **pull request**: a request to add your branch to another repo. It shows the [[diff]] and has room for comments. Adding it is called a **merge**.
- **checks**: automatic tests that run on a pull request and pass or fail.

## Your contribution: one tip

Every member who reaches this stage adds one tip for beginners to the DSSA site. Your tip is a small file in the DSSA repo:

```
src/data/tips/{{githubUsername}}.json
```

The file is written in **JSON**, a plain text format for data. It holds one value, named `tip`:

```json
{
  "tip": "Commit after every change that works. Then a bad change is one step to undo."
}
```

## What happens after you open the pull request

A **GitHub Action** is an automatic job that GitHub runs when something happens in a repo. One runs each time a tip pull request opens. It merges yours when all of these are true:

- The pull request adds or changes one file, in `src/data/tips/`.
- The file is named with your GitHub username plus `.json`.
- The file has only the `tip` value.
- The tip is plain text, 200 characters at most, with no links and no formatting tags such as `<b>`.
- Your GitHub username is the one you saved in Stage 2, and you have reached this stage.

If every check passes, the Action merges your pull request and comments to say so. A few minutes later, your tip is on the Beginner Tips page and your member card shows **Contributor**.

If a check fails, the Action comments with the reason. Fix your file, commit, and push to the same branch. The checks run again.

You practice first, with a pull request in your own repo.
