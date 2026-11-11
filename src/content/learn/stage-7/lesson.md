# Your first pull request

Only officers can push to the DSSA repo. Everyone else suggests changes with a pull request.

## Four words

- **fork**: your own copy of someone else's repo, on your GitHub account. You can push to your fork.
- **branch**: a separate line of commits. You make a change on a branch so `main` is not touched until the change is accepted.
- **pull request**: a request to merge your branch into another repo. It shows the diff and has room for comments.
- **checks**: automated tests that run on a pull request and pass or fail.

## Your contribution: one tip

Every member who reaches this stage adds one tip for beginners to the DSSA site. Your tip is a small file in the DSSA repo:

```
src/data/tips/{{githubUsername}}.json
```

It holds one field:

```json
{
  "tip": "Commit after every change that works. Then a bad change is one step to undo."
}
```

## What happens after you open the pull request

A GitHub Action checks your pull request. It merges it when all of these are true:

- The pull request adds or changes one file, in `src/data/tips/`.
- The file is named with your GitHub username plus `.json`.
- The file has only the `tip` field.
- The tip is plain text, 200 characters at most, with no links and no HTML.
- Your GitHub username is the one you saved in Stage 2, and you have passed this stage's check.

If every check passes, the Action merges your pull request and comments to say so. A few minutes later, your tip is on the Beginner Tips page and your member card shows **Contributor**.

If a check fails, the Action comments with the reason. Fix your file, commit, and push to the same branch. The checks run again.

You practice first, with a pull request in your own repo.
