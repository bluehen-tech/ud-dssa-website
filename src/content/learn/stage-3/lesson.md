# Going live

:::short
- Your site runs on your laptop, where only you can see it.
- A service called **Vercel** keeps a live copy on the web, where anyone can see it.
- Each time you push to GitHub, Vercel updates the live copy.
- If your new code has an error, Vercel keeps the old version live.
:::

## Two copies of your site

In Stage 2 you opened your site at `localhost:3000`. That address shows the copy running on your laptop. Only you can open it.

The live copy, which anyone can open, is called **production**. bluehen-dssa.org is the production copy of the DSSA site.

## How a push becomes live

**Vercel** is a service that puts a site on the web. You connect Vercel to your GitHub [[repo]] once. After that, each [[push]] starts a **deploy**: Vercel downloads your code, gets it ready, and puts the new version live. This takes a minute or two.

bluehen-dssa.org changes the same way. A change reaches GitHub, Vercel deploys it, and the live site updates.

:::more Which pushes go live
Your repo's main line of commits is named `main`. Vercel puts `main` live. Stage 7 covers other lines of commits, called branches, which do not change the live site.
:::

## The build

Before a deploy goes live, Vercel runs a **build**. The build turns your code into the files a browser needs.

If the build fails, Vercel keeps the last working version live and shows you the error. Visitors never see a broken build.

You can run the same build on your laptop with `npm run build`. Run it before you push.

## Keys and the live site

In Stage 2 you learned that [[keys]] stay in `.env.local` and never go to GitHub. So Vercel cannot see them. When your site needs a key, you add it in Vercel's settings as well. Stage 5 does this.

Test on your laptop first, then push.
