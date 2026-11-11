## 1. Check the build on your laptop

In Cursor's [[terminal]], in `my-dssa-site`, run:

```
npm run build
```

Do this now: read the last lines. They should list your pages with no red error text.

:::more If the build shows an error
Copy the whole error into the agent panel and ask what it means. Fix it before you go on. Vercel runs this same build, so an error here would also stop your site from going live.
:::

## 2. Create a Vercel account

- Go to [vercel.com](https://vercel.com) and click **Sign Up**.
- Choose the free **Hobby** plan.
- Choose **Continue with GitHub** and allow access.

## 3. Import your repo

This step connects Vercel to your GitHub [[repo]]. You do it once.

- In Vercel, click **Add New**, then **Project**.
- Find `my-dssa-site` in the list and click **Import**.
- Leave the settings as they are. Click **Deploy**.

After a minute or two, Vercel shows a web address that ends in `.vercel.app`.

Do this now: open that address on your phone. You should see your name.

## 4. Watch a push go live

Ask the agent:

> Add one line under my name that says what I study, which is ___. Change nothing else.

Read the [[diff]], then [[commit]] and [[push]]:

```
git add -A
git commit -m "Add what I study"
git push
```

Do this now: in Vercel, open your project and click **Deployments**. Watch the newest one go from Building to Ready. Then refresh your `.vercel.app` page. The new line should be there.

## 5. Link it from your portfolio

Open [your portfolio](/members/me) on bluehen-dssa.org and add your `.vercel.app` address as your website link.

## Done when

- [ ] `npm run build` finishes with no errors
- [ ] Your `.vercel.app` address shows your name
- [ ] A push updated the live site
- [ ] Your portfolio links to your site
