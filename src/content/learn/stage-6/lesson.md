# Guided tours

These four tours show how the real DSSA site handles sign-in, security, files and email. You read the code. You do not change it. Each tour is one screen.

## Tour 1: Sign-in

You sign in to bluehen-dssa.org without a password.

1. On the login page, you type your email. `src/app/login/page.tsx` checks that it ends in `@udel.edu`.
2. The page asks **Supabase Auth** to email you a code:

```ts
await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
```

3. You type the code. Supabase checks it and starts a **session**, which keeps you signed in for four hours.
4. `src/middleware.ts` runs before every page. It asks Supabase whether your session is still valid and refreshes it. On pages such as `/members/me` and `/learn`, it sends signed-out visitors to the login page. It also checks the `@udel.edu` ending again.

Only someone who can open your UD inbox can sign in as you.

## Tour 2: Row-level security

**Row-level security** is a set of rules inside the database that decide who can read or change each row. The rules run in Postgres, so they hold even if a page has a bug.

The DSSA portfolio plan in `docs/MEMBER_PORTFOLIOS_PLAN.md` includes rules like this one:

```sql
create policy "Owner can read own portfolio"
on public.member_portfolios
for select
to authenticated
using (auth.uid() = user_id);
```

`auth.uid()` is the signed-in user. The rule lets you read a row only when its `user_id` is yours. Another rule lets anyone read portfolios whose `status` is `published`. That is why your card is public and your drafts are not.

Your Stage 5 table used the same idea: visitors may add a row but not read one.

## Tour 3: File storage

**Supabase Storage** keeps files, such as photos and resumes, in folders called **buckets**. The database row stores only the file's address.

When you added your photo, `src/app/members/me/page.tsx` did this:

```ts
const path = `${session.user.id}/${safeName}`;
await supabase.storage.from('member-portfolio-photos').upload(path, file);
const { data } = supabase.storage.from('member-portfolio-photos').getPublicUrl(path);
```

The photo goes in a folder named after your user ID. Its public address is saved in your row's `profile_image_url` column. The members page reads that address to show your photo.

## Tour 4: Email

**Resend** is the service that sends the site's email.

- **Sign-in codes.** Supabase sends them through Resend, using the bluehen-dssa.org domain, so they arrive from the club's own address.
- **Club emails.** When an officer sends a newsletter from `/email`, `src/app/api/email/send/route.ts` posts each message to Resend:

```ts
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${resendApiKey}` },
  ...
});
```

The `RESEND_API_KEY` is an environment variable on Vercel. It is never in the repo.
