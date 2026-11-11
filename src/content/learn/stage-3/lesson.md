# Going live

Your site now runs on your laptop at `localhost:3000`. Only you can see it.

**Production** is the live copy of a site that anyone can open. bluehen-dssa.org is the production copy of the DSSA site.

## How a push becomes live

**Vercel** puts Next.js sites on the web. You connect Vercel to your GitHub repo once. After that, each push to the `main` branch starts a **deploy**: Vercel downloads your code, builds it, and puts the new version live. This takes a minute or two.

bluehen-dssa.org changes the same way. A change is merged into `main` on GitHub, Vercel deploys it, and the live site updates.

## The build

The **build** turns your code into the files a browser needs. If the build fails, Vercel keeps the last working version live and shows the error in the deploy log. Visitors never see a broken build.

You can run the same build on your laptop with `npm run build`. Run it before you push.

## Keys and the live site

Files listed in `.gitignore`, such as `.env.local`, are not on GitHub. So Vercel cannot see them. You add those values in Vercel's project settings instead. Stage 5 does this.

Test on your laptop first, then push.
