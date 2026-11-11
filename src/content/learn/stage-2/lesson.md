# Saving your work with Git and GitHub

:::short
- **Git** saves versions of your project on your laptop. Each saved version is a **commit**.
- **GitHub** is a website that keeps a copy of your commits online. They get there when you **push**.
- A **diff** shows the lines that changed. Read it before you save a version.
- Passwords and keys never go into a commit.
:::

## Why save versions

When you write a paper, you might keep copies named draft1, draft2 and final. **Git** does this for a whole project folder, and it records what changed each time.

Each saved version is a **commit**. A commit has a short message that says what changed. If a later change breaks something, you can go back to your last good commit.

Git runs on your laptop. **GitHub** is a website that keeps a copy of your commits online. The code for bluehen-dssa.org is kept on GitHub.

## Five words

| Word | Meaning |
| --- | --- |
| **repository** (repo) | A project folder whose versions Git saves |
| commit | A saved version, with a message |
| **push** | Send your new commits to GitHub |
| **clone** | Download a copy of a repo to your laptop |
| **diff** | The lines that changed between two versions |

Your commits stay on your laptop until you push them.

## The everyday rhythm

```
git add -A
git commit -m "Add my name to the home page"
git push
```

The first line gathers every changed file. The second saves a commit with that message. The third sends it to GitHub.

Commit after each small change that works.

:::more What git add does
Git calls gathering changes "staging". `git add -A` stages every changed file. You can also stage one file by naming it, such as `git add README.md`. Then the commit leaves your other changes out.
:::

## Reading a diff

```
-  title: "Create Next App",
+  title: "Jordan Lee",
```

A line that starts with `-` was removed. A line that starts with `+` was added. Cursor shows the same thing in red and green after the [[agent]] edits a file.

Before every commit, read the diff and ask: does this match what I asked for?

## Secrets are never committed

A **key** is a long password that lets a site use a service, such as its database. Keys must stay private.

Keys go in a file named **`.env.local`**. A second file, **`.gitignore`**, lists files Git must never commit. `.env.local` is on that list.

If a diff ever puts a key in another file, or removes `.env.local` from `.gitignore`, reject that change. Once a key is pushed to GitHub, treat it as public.

:::more How bluehen-dssa.org does this
Its database keys are in `.env.local` on officers' laptops, and in the settings of the service that runs the live site. They are not in the GitHub repo.
:::

## Starting from a template

The build card starts you from the DSSA starter, a small ready-made site. On GitHub you click **Use this template** to make your own copy of it. Then you clone your copy to your laptop.
