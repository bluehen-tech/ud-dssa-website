# Saving data

:::short
- A database keeps a site's data in **tables**. A table has rows and columns, like one tab of a spreadsheet.
- A page does not save to the database itself. It asks code that runs on the **server**, called an **API route**, to do it.
- The database's keys are kept outside your code, as **environment variables**.
:::

## Tables and rows

A [[database]] is where a site keeps its data. Inside it, a **table** holds data in rows and columns, like one tab of a spreadsheet. Each column has a name. Each **row** is one record.

On bluehen-dssa.org, the `member_portfolios` table has one row per member. Its columns include `name`, `bio` and `status`. Your portfolio is one row in that table.

## Supabase

Someone has to run the database and keep it online. The DSSA site uses a service called **Supabase** for that. You will make a free Supabase project with one table of your own.

:::more What else Supabase does
Supabase also handles sign-in and keeps files such as photos. Stage 6 shows both. The database it runs is called Postgres, which many companies use.
:::

## API routes

Your pages run in the visitor's browser. A visitor can see and change anything that runs there. So a page should not save to the database directly.

A **server** is a computer on the web that runs your site's code. An **API route** is a file that runs on the server, where visitors cannot change it. It receives a request from the page, checks it, and then reads or saves a row.

On bluehen-dssa.org, the Get Connected form sends your details to an API route. That route checks the fields and saves a row.

The order is always the same: the page sends a request, the API route checks it, and the table stores it.

:::more Where that API route is
It is the file `src/app/api/submit-form/route.ts` in the DSSA repo. A file named `route.ts` inside `src/app/api` is an API route, the same way a file named `page.tsx` is a page.
:::

## Environment variables

In Stage 2 you learned that [[keys]] stay out of your code. **Environment variables** are how the code still gets them. Each one is a named setting kept outside the code.

Supabase gives each project a web address and a key. You put them in `.env.local` on your laptop, and in Vercel's settings for the live site. The code reads them by name.

:::more What reading by name looks like
In code, `process.env.NEXT_PUBLIC_SUPABASE_URL` means "the value of the setting named NEXT_PUBLIC_SUPABASE_URL".
:::

## Paused projects

A free Supabase project pauses after about a week with no activity. A paused project stops answering, so forms that use it fail. To restore it, open the Supabase dashboard, pick the project, and click **Restore**. Your data is kept.
