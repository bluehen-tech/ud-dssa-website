## 1. Create a GitHub account

Go to [github.com](https://github.com) and sign up. Pick a username you would put on a resume.

## 2. Save your GitHub username

Type it in the box below this card and click Save. The site checks that the account exists. Stage 7 uses it. You can change it later from the path map.

## 3. Install Git

- **Windows:** go to [git-scm.com/downloads](https://git-scm.com/downloads), download Git for Windows, and run the installer. The default options are fine.
- **Mac:** open the [[terminal]] and run `git --version`. If Git is not installed, macOS offers to install it. Click Install.

Do this now: close Cursor fully and open it again. In a new terminal, run `git --version`. You should see something like `git version 2.47.0`.

## 4. Tell Git who you are

Run these three lines. Use your name and the email on your GitHub account.

```
git config --global user.name "Your Name"
git config --global user.email "you@udel.edu"
git config --global init.defaultBranch main
```

Git puts this name on each commit you make.

Do this now: run `git config --global --list`. You should see your name and email.

## 5. Copy the DSSA starter

- Open [github.com/bluehen-tech/dssa-starter](https://github.com/bluehen-tech/dssa-starter).
- Click **Use this template**, then **Create a new repository**.
- Name it `my-dssa-site`. Choose **Public**. Click **Create repository**.
- On your new repo page, click the green **Code** button and copy the HTTPS address.

## 6. Clone it

In Cursor's terminal, make sure you are in your `code` folder (`pwd`). Then run:

```
git clone <the address you copied>
```

Choose **File > Open Folder** and open `code/my-dssa-site`.

## 7. Run the starter

```
npm install
npm run dev
```

**npm** is a tool that came with Node.js. The first command downloads the code the starter depends on. It can take a minute. The second command starts the site on your laptop and keeps it running.

Open [http://localhost:3000](http://localhost:3000) in your browser, such as Chrome, Safari or Edge. **localhost** is the address of a site running on your own laptop, so only you can open it. You should see the DSSA starter page.

## 8. Make your first commit

Ask the [[agent]]:

> Change the main heading on the home page to my name, which is ___. Change nothing else.

Read the diff. Accept it only if it changes the heading and nothing more.

The first terminal is busy running the site. Click the **+** in the terminal panel to open a second one, then run:

```
git add -A
git commit -m "Put my name on the home page"
git push
```

The first time you push, Git asks you to sign in to GitHub. Follow the prompt in your browser.

:::more If the terminal asks for a password
Ask the agent: "Help me sign in to GitHub so git push works."
:::

Do this now: refresh your repo page on GitHub. Your commit message should appear at the top of the file list.

## Done when

- [ ] Your GitHub username is saved below
- [ ] `git --version` prints a version number
- [ ] The starter runs at localhost:3000 with your name on it
- [ ] Your commit appears on GitHub
