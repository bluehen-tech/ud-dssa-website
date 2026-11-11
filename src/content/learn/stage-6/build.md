There is nothing to deploy in this stage. You read the real code with the agent's help.

## 1. Get a copy of the DSSA code

In Cursor's terminal, go to your `code` folder and run:

```
git clone https://github.com/bluehen-tech/ud-dssa-website.git
```

Choose **File > Open Folder** and open `code/ud-dssa-website`. You do not need to install or run it.

## 2. Ask the agent to walk each tour

Ask these one at a time. Open each file it names and find the lines yourself.

> Explain how sign-in works in this repo, step by step. Name each file involved. Do not change any files.

> Show me where this repo decides who can read a member portfolio. Explain it in plain words. Do not change any files.

> Show me the code that uploads a member's profile photo, and where its address is saved. Do not change any files.

> Show me where this repo sends email with Resend. Do not change any files.

## 3. Check yourself

Do this now: without looking, say out loud or write down one sentence for each tour. For example: "Sign-in sends a code to my UD email, and middleware keeps signed-out visitors off member pages."

## Done when

- [ ] You opened `src/app/login/page.tsx` and `src/middleware.ts`
- [ ] You found the photo upload in `src/app/members/me/page.tsx`
- [ ] You found the Resend call in `src/app/api/email/send/route.ts`
- [ ] You can explain each tour in one sentence
