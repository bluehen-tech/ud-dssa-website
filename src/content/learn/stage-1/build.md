## 1. Install Node.js

Node.js runs the tools the starter site needs.

- Go to [nodejs.org](https://nodejs.org) and download the **LTS** version.
- **Windows:** run the `.msi` installer. Keep the default options.
- **Mac:** run the `.pkg` installer.

## 2. Install Cursor

- Go to [cursor.com](https://cursor.com) and download Cursor.
- **Windows:** run the installer.
- **Mac:** open the download and drag Cursor into Applications.
- Open Cursor. Sign in or create a free account.
- If Cursor opens on a screen with only a chat box and no file list, look for the option to open the editor (it may be labeled IDE). The build cards use the editor.

## 3. Make a code folder

- **Windows:** open File Explorer and go to `C:\Users\<your name>`. Create a folder named `code`. Check that the path does not include OneDrive.
- **Mac:** open Finder and go to your home folder (the one with your name). Create a folder named `code`.
- In Cursor, choose **File > Open Folder** and pick `code`.

## 4. Run your first commands

In Cursor, choose **Terminal > New Terminal**. The terminal opens at the bottom.

Do this now: type `node --version` and press Enter. You should see a version number, such as `v22.11.0`.

If you see "not recognized" or "command not found", close Cursor fully and open it again. The terminal was open before Node.js was installed.

Do this now: type `pwd` and press Enter. The last part of the answer should be `code`.

## 5. Ask the agent one question

In the agent panel, type:

> What folder is open, and what is in it? Do not change any files.

Do this now: read the answer. It should name your `code` folder and say it is empty.

## Done when

- [ ] `node --version` prints a version number
- [ ] `pwd` shows your `code` folder
- [ ] The agent described your folder without changing anything
- [ ] You can point to the file explorer, editor, agent panel and terminal
