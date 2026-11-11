# Git and GitHub

**Git** saves versions of your project. Each saved version is a **commit**. A commit has a short message that says what changed. **GitHub** keeps a copy of your commits online.

## Six words

| Word | Meaning |
| --- | --- |
| **repository** (repo) | A project folder that Git tracks |
| **stage** | Choose which changes go into the next commit (`git add`) |
| commit | Save a version with a message (`git commit`) |
| **push** | Send your new commits to GitHub (`git push`) |
| **clone** | Download a copy of a repo, with its history (`git clone`) |
| **diff** | The lines that changed between two versions |

Your commits stay on your laptop until you push them.

## The everyday rhythm

```
git add -A
git commit -m "Add my name to the home page"
git push
```

The first line stages every changed file. The second saves a commit with that message. The third sends it to GitHub.

Commit after each change that works. If a later change breaks something, you can go back to your last good commit.

## Reading a diff

```
-  title: "Create Next App",
+  title: "Jordan Lee",
```

A line that starts with `-` was removed. A line that starts with `+` was added. Cursor shows the same thing in red and green after the agent edits a file.

Before every commit, read the diff and ask: does this match what I asked for?

## Secrets are never committed

Some values must stay private, such as the key that lets a site write to its database. These go in a file named `.env.local`. A file named `.gitignore` lists files Git must never commit, and `.env.local` is on that list.

bluehen-dssa.org works this way. Its database keys are in `.env.local` on officers' laptops and in Vercel's settings. They are not in the GitHub repo.

If a diff ever puts a key in another file, or removes `.env.local` from `.gitignore`, reject that change. Once a key is pushed to GitHub, treat it as public.

## Templates

The DSSA starter is a **template repo**. On GitHub you click **Use this template** to make your own copy. Then you clone your copy to your laptop.
