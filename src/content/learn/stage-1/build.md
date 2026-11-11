## 1. Install Node.js

**Node.js** is a free program that runs the tools your site project needs. You install it once and do not open it yourself.

- Go to [nodejs.org](https://nodejs.org) and download the **LTS** version. LTS is the stable one.
- **Windows:** run the `.msi` installer. Keep the default options.
- **Mac:** run the `.pkg` installer.

## 2. Install Cursor

- Go to [cursor.com](https://cursor.com) and download Cursor.
- **Windows:** run the installer.
- **Mac:** open the download and drag Cursor into Applications.
- Open Cursor. Sign in or create a free account.

:::more If Cursor opens with only a chat box and no file list
Look for the option to open the editor. It may be labeled IDE, in the upper-right corner. The build cards use the editor.

![Cursor open with only a chat box. A red arrow points to the IDE button in the upper-right corner.](/images/learn/cursor-open-editor.png)
:::

## 3. Make a code folder

- **Windows:** open File Explorer and go to `C:\Users\<your name>`. Create a folder named `code`. Check that the path does not include OneDrive.
- **Mac:** open Finder and go to your home folder (the one with your name). Create a folder named `code`.
- In Cursor, choose **File > Open Folder** and pick `code`.

## 4. Run your first commands

In Cursor, choose **Terminal > New Terminal**. The terminal opens at the bottom.

Do this now: point to each of the four parts of the window from the lesson: the file explorer, the editor, the agent panel and the terminal. If the agent panel is closed, press **Ctrl+L** (**Cmd+L** on a Mac).

Do this now: type `node --version` and press Enter. You should see a version number, such as `v22.11.0`.

:::more If you see "not recognized" or "command not found"
Close Cursor fully and open it again. The terminal was open before Node.js was installed, so it does not know about it yet.
:::

Do this now: type `pwd` and press Enter. The last part of the answer should be `code`.

## 5. Try the four commands

Type each line and press Enter. Read the answer before you type the next one.

```
mkdir practice
ls
cd practice
pwd
cd ..
pwd
```

- `mkdir practice` makes a folder named `practice`. It also appears in the file explorer.
- `ls` lists what is in `code`. You should see `practice`.
- `cd practice` moves you into the new folder. Now `pwd` ends with `practice`.
- `cd ..` moves you back up one folder. Now `pwd` ends with `code` again.

## 6. Ask the agent one question

In the agent panel, type:

> What folder is open, and what is in it? Do not change any files.

Do this now: read the answer. It should name your `code` folder and the `practice` folder inside it.

## 7. Ask the agent for one small change

In the agent panel, type:

> Create a file named hello.txt in the practice folder. It has one line: Hello from ___. Change nothing else.

Before you keep the change, read it. Cursor lists each file the agent changed and shows added lines in green. Check that there is one new file, in `practice`, with one line. Then keep the change. The button may be labeled **Keep** or **Accept**.

Do this now: open `hello.txt` from the file explorer. Your line should show in the editor.

## Done when

- [ ] `node --version` prints a version number
- [ ] You made the `practice` folder, moved into it and back, and `pwd` showed where you were each time
- [ ] The agent described your folder without changing anything
- [ ] You read the agent's change to `hello.txt` before you kept it
- [ ] You can point to the file explorer, editor, agent panel and terminal
