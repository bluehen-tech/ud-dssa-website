## 1. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and sign in with GitHub.
- Click **New project**. Name it `my-dssa-site`.
- Create a database password and save it in a password manager. You will not need it for this stage, but you cannot see it again later.
- Pick the region closest to you, such as East US. Click **Create new project** and wait for it to finish.

## 2. Create a table

**SQL** is the language for giving a database instructions. You do not need to write it. You paste it.

In your project, open **SQL Editor** and click **New query**. Paste this and click **Run**:

```sql
create table signups (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

alter table signups enable row level security;

create policy "Anyone can sign up"
  on signups for insert to anon
  with check (true);
```

The first part creates the table, with four columns. The last two parts turn on [[row-level security]] and add one rule: visitors may add a row. No rule lets them read rows, so they cannot. Stage 6 explains this.

Do this now: open **Table Editor**. You should see a `signups` table with no rows.

## 3. Add your keys

In Supabase, open **Project Settings > API Keys**. Find the **Project URL**, which is your project's web address, and the **publishable** key. Older projects call it the **anon** key.

In Cursor's terminal, in `my-dssa-site`, copy the example file:

- **Windows:** `Copy-Item .env.example .env.local`
- **Mac:** `cp .env.example .env.local`

Open `.env.local` in the editor and paste the two values after the `=` signs. Save.

Stop the site with **Ctrl+C** in its terminal, then start it again with `npm run dev`. The site reads `.env.local` only when it starts.

## 4. Build the sign-up form

Ask the agent:

> Install @supabase/supabase-js. Create an API route at src/app/api/signup/route.ts that accepts a POST with a name and an email, checks that both are present and that the email contains @, and inserts a row into the signups table using the values in .env.local. Do not read the row back after inserting. Then add a sign-up form to the home page, styled like the DSSA Get Connected form, that posts to this route and shows a thank-you message. Explain each file you change.

Read the diff. Check that no key value appears in any file except `.env.local`.

Do this now: submit the form on localhost:3000. In Supabase **Table Editor**, open `signups`. Your row should be there.

## 5. Put it live

- In [[Vercel]], open your project, then **Settings > Environment Variables**.
- Add the same two names and values from `.env.local`. The live site cannot see that file, so it needs its own copy.
- Commit and push your code:

```
git add -A
git commit -m "Add sign-up form"
git push
```

Vercel reads environment variables when it builds, so this push picks them up.

Do this now: submit the form on your `.vercel.app` site. A second row should appear in Supabase.

## Done when

- [ ] The `signups` table exists, and the SQL ran with no error
- [ ] `.env.local` holds your keys, and `git status` does not list it
- [ ] The form on localhost added a row
- [ ] The form on your live site added a row
