# Data

## Tables and rows

A **database table** holds data in rows and columns. Each column has a name and a type. Each row is one record.

On bluehen-dssa.org, the `member_portfolios` table has one row per member. Its columns include `name`, `bio`, `profile_image_url` and `status`. Your portfolio is one row in that table.

The DSSA site uses **Supabase**. Supabase runs a Postgres database for you, with sign-in and file storage built in.

## API routes

A browser should not write to the database directly. An **API route** is a file that runs on the server. It receives a request from the page, checks it, and then reads or writes the table.

On bluehen-dssa.org, the Get Connected form sends your details to `src/app/api/submit-form/route.ts`. That route checks the fields and saves a row.

The order is always the same: the page sends a request, the API route checks it, and the table stores it.

## Environment variables

**Environment variables** hold settings and keys outside your code. Supabase gives each project a URL and a key. They go in `.env.local` on your laptop and in Vercel's settings for the live site. The code reads them by name, such as `process.env.NEXT_PUBLIC_SUPABASE_URL`.

## Paused projects

A free Supabase project pauses after about a week with no activity. A paused project stops answering, so forms that use it fail. To restore it, open the Supabase dashboard, pick the project, and click **Restore**. Your data is kept.
