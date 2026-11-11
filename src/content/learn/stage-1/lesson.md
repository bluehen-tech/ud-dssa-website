# Your toolkit

**Cursor** is a code editor with an AI agent built in. You ask the agent for a change in plain words. It edits your files, and you check what it did.

The **terminal** is a window where you type commands. The computer answers in text. Cursor has a terminal built in, at the bottom of its window.

## Already use VS Code?

That is fine. Cursor is built on VS Code, and GitHub Copilot's agent mode works the same way. Some buttons and menu names will differ from the steps here, but the work is the same: ask for one small change, read what changed, then keep it or undo it. GitHub offers Copilot free to verified students. Check github.com/education for details.

## The four parts of the Cursor window

- **File explorer**, on the left: every folder and file in your project.
- **Editor**, in the middle: the file you are reading or changing.
- **Agent panel**, on the right: where you ask the AI for a change.
- **Terminal**, at the bottom: where you type commands such as `npm run dev`.

## Four terminal commands

| Command | What it does |
| --- | --- |
| `pwd` | Shows the folder you are in |
| `ls` | Lists what is in that folder |
| `cd` | Moves into another folder |
| `mkdir` | Creates a new folder |

These work in the Windows terminal (PowerShell) and in the Mac terminal.

## Working with the agent

- Ask for one small change at a time. "Add my name to the home page" is better than "Build my website". You can check a small change in a minute.
- Read what changed before you accept it. Cursor shows removed lines in red and added lines in green. Ask yourself: does this match what I asked for?
- When something breaks, copy the exact error message into the agent panel. It names the file, the line and the problem.
- You should be able to explain every change you keep. If you cannot, ask the agent to explain it before you accept.

## Keep projects in a plain folder

Put your projects in a folder on your laptop, such as `code` in your home folder. Do not put them in OneDrive, iCloud Drive, Dropbox or Google Drive. Those apps copy files while tools are still writing them, and projects break.

## Accounts you will need

Each of these is free and needs no credit card.

| Account | First used in | What it is for |
| --- | --- | --- |
| Cursor | Stage 1 | The editor and its AI agent |
| GitHub | Stage 2 | Keeps your code online |
| Vercel | Stage 3 | Puts your site on the web |
| Supabase | Stage 5 | Your database |

Cursor's free plan includes a limited number of AI requests each month. Check the pricing page at cursor.com for the current limit and for any student offer. Small, clear requests use fewer of them.
