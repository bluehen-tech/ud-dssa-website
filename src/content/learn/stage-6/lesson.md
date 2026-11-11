# Guided tours

:::short
- **Sign-in:** the site emails a code to your UD address. It stores no password.
- **Security:** rules inside the database decide who can read each row.
- **Files:** photos are kept in file storage. The database keeps only each photo's address.
- **Email:** a service called **Resend** sends the site's email.
:::

These four tours show how the real DSSA site handles sign-in, security, files and email. You read the code. You do not change it.

Each tour starts in plain words. Open **See the code** when you want the real lines.

## Tour 1: Sign-in

You sign in to bluehen-dssa.org without a password.

1. You type your email on the login page. The page checks that it ends in `@udel.edu`.
2. [[Supabase]] emails you a six-digit code.
3. You type the code. Supabase checks it and starts a **session**. A session is the site's record that you are signed in. It lasts four hours.
4. Before each page opens, a file named `middleware.ts` runs. **Middleware** is code that runs before a page opens. It checks for your session. On pages such as `/members/me` and `/learn`, it sends signed-out visitors to the login page.

Only someone who can open your UD inbox can sign in as you.

:::more See the code
The login page is `src/app/login/page.tsx`. It asks Supabase to email the code with this line:

```ts
await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
```

The middleware is `src/middleware.ts`. On every request it asks Supabase whether your session is still valid, and it checks the `@udel.edu` ending again.
:::

## Tour 2: Row-level security

**Row-level security** is a set of rules inside the database. The rules decide who can read or change each [[row]]. They run in the database itself, so they hold even if a page has a bug.

On the `member_portfolios` table, one rule lets you read your own row. Another rule lets anyone read rows whose `status` is `published`. That is why your card is public and your drafts are not.

Your Stage 5 table used the same idea: visitors may add a row but not read one.

:::more See a rule
The DSSA portfolio plan in `docs/MEMBER_PORTFOLIOS_PLAN.md` includes rules like this one:

```sql
create policy "Owner can read own portfolio"
on public.member_portfolios
for select
to authenticated
using (auth.uid() = user_id);
```

`auth.uid()` is the signed-in user. The rule lets you read a row only when its `user_id` is yours.
:::

## Tour 3: File storage

Tables hold text and numbers well. Files, such as photos and resumes, are kept somewhere else: **Supabase Storage**.

When you added your photo, the site saved the file in Supabase Storage. Then it saved the photo's web address in your row. The members page reads that address to show your photo.

:::more See the code
Supabase Storage keeps files in folders called buckets. In `src/app/members/me/page.tsx`:

```ts
const path = `${session.user.id}/${safeName}`;
await supabase.storage.from('member-portfolio-photos').upload(path, file);
const { data } = supabase.storage.from('member-portfolio-photos').getPublicUrl(path);
```

The photo goes in a folder named after your user ID, inside the `member-portfolio-photos` bucket. Its public address is saved in your row's `profile_image_url` column.
:::

## Tour 4: Email

**Resend** is the service that sends the site's email. It sends two kinds:

- **Sign-in codes.** Supabase hands each code to Resend, so it arrives from the club's own address.
- **Club emails.** When an officer sends a newsletter, the site hands each message to Resend.

The [[key]] that lets the site use Resend is an [[environment variable]]. It is never in the [[repo]].

:::more See the code
Officers send newsletters from the `/email` page. `src/app/api/email/send/route.ts` posts each message to Resend:

```ts
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${resendApiKey}` },
  ...
});
```

The key is the environment variable `RESEND_API_KEY`, set on Vercel.
:::
