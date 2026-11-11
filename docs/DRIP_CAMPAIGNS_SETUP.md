# Drip Campaigns Setup

Event email sequences: an admin enters one event brief, the AI drafts one email per stage (save the date, full details, reminder, last chance), the admin edits and **approves each email**, chooses an audience and **launches**. A scheduled worker then sends each step at its scheduled time.

AI only drafts text. It never picks recipients, schedules, or sends.

- Admin UI: `/email/campaigns` (linked from `/email`)
- API: `/api/email/campaigns*` (admin only, checked server-side on every route)
- Worker: `/api/cron/drip` (protected by `CRON_SECRET`)

## 1. Database

Run [`docs/sql/drip_campaigns.sql`](sql/drip_campaigns.sql) in Supabase Dashboard → SQL Editor. It is **not** applied automatically. It creates:

| Table | Purpose |
| --- | --- |
| `drip_campaigns` | One per sequence: event date/time/zone, audience filter, status |
| `drip_campaign_steps` | The emails: subject, Markdown body, days-before offset, local send time, derived `send_at`, human approval |
| `drip_enrollments` | Audience snapshot: one row per contact per campaign |
| `drip_sends` | One row per recipient per step (the delivery attempt). `UNIQUE (enrollment_id, step_id)` is what prevents duplicate sends |

and these functions (service role only): `drip_save_campaign`, `drip_launch_campaign`, `drip_claim_due`, `drip_finish_send`, `drip_complete_finished_campaigns`, `drip_campaign_stats`.

RLS is enabled on all four tables. Admins (`profiles.admin_flag`) can read; **nobody can write from the browser**. All writes happen in API routes (after an admin check) or the worker, using the service-role key.

Assumption to verify: `contacts.id` is a `uuid` (the FK from `drip_enrollments.contact_id` needs the same type).

## 2. Environment variables

Set on the deployed site (Vercel → Settings → Environment Variables). Values are never returned by any endpoint; the launch route only reports the *names* of missing variables.

| Variable | Used for |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` | Worker and campaign writes (server only) |
| `RESEND_API_KEY` | Delivery |
| `CRON_SECRET` | Bearer secret the scheduler must present to `/api/cron/drip`. Generate one: `openssl rand -hex 32` |
| `UNSUBSCRIBE_TOKEN_SECRET` | HMAC key for signed unsubscribe links. Generate one: `openssl rand -hex 32`. **Do not rotate casually**: links in already-sent emails stop verifying |
| `NEXT_PUBLIC_SITE_URL` | Base URL used in unsubscribe links (the worker has no request to infer it from) |
| `RESEND_FROM_EVENT` (optional) | Sender for event emails; falls back like the one-off sender |
| `UNSUBSCRIBE_REQUIRE_TOKEN` (optional) | `true` to reject unsubscribe requests without a valid token (see below) |

Launch is refused (HTTP 503) while `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET` or `UNSUBSCRIBE_TOKEN_SECRET` is missing.

## 3. Scheduler

The site is deployed on Vercel, which has no built-in background jobs; something must call `/api/cron/drip` regularly. The endpoint accepts `GET` or `POST` with `Authorization: Bearer $CRON_SECRET` and processes one bounded batch (40 sends, ~50 s budget) per call. Overlapping calls are safe.

**Default: GitHub Actions** (works on every Vercel plan). `.github/workflows/drip-worker.yml` runs every 15 minutes. Add two repository secrets:

- `DRIP_WORKER_URL` = `https://<your-domain>/api/cron/drip`
- `CRON_SECRET` = the same value as on Vercel

Until both are set the job exits successfully without calling anything. GitHub schedules are best-effort and can be delayed by several minutes under load; a step may therefore go out a little after its scheduled minute, never before.

**Alternative: Vercel Cron** (sub-daily schedules need the Pro plan; on Hobby a `vercel.json` cron more frequent than daily makes the **deployment fail**, which is why it is not committed). On Pro, add `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/drip", "schedule": "*/10 * * * *" }] }
```

Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set. If you use this, disable the GitHub workflow.

Throughput: ~2 emails/second (Resend's default limit), so one run sends at most ~40 emails; at a 15-minute cadence that is ~160/hour. A 2,000-person audience takes about 12 hours to drain, so schedule large audiences' first step well ahead of when you need it delivered. Raise `batchSize` in `src/app/api/cron/drip/route.ts` only together with a shorter cadence and a plan whose function timeout allows it.

## 4. How sending stays safe

- **Claiming is atomic.** `drip_claim_due` locks due enrollments (`FOR UPDATE SKIP LOCKED`) and inserts the `drip_sends` row; `UNIQUE (enrollment_id, step_id)` makes a second claim of the same recipient/step impossible, so concurrent or retried runs cannot create duplicate attempts.
- **Re-checked right before every send:** campaign still `active`, event not started, contact still exists and not suppressed (global `status = 'unsubscribed'`, or `unsubscribed_lists` containing `all` or `event`). A suppressed recipient is skipped and their sequence stops.
- **Provider idempotency.** Every Resend request carries `Idempotency-Key: drip-<send id>`. If the worker loses the response (timeout/crash), the retry reuses the key, so Resend returns the original result rather than delivering again. The key is only retried within 20 h (Resend keeps keys for 24 h).
- **Uncertain, not guessed.** After 3 attempts, or once the idempotency window has passed, a send whose outcome is unknown is recorded as `uncertain`, the recipient's enrollment is `held`, and it is **never retried automatically**. The campaign page shows the count under "Needs review". Check the Resend dashboard for that recipient and decide manually.
- **Failures.** A definitive provider rejection (e.g. invalid address) marks that send `failed` and stops that recipient only. Auth/rate-limit responses (401/403/429) stop the whole run without recording failures, and the unstarted claims are released for the next run.
- **Pause / resume.** A paused campaign is never claimed, and claims made just before a pause are released before sending. Resume continues where each recipient left off; completed steps are never resent. Steps that came due while paused go out on resume, unless the event has already started.
- **Late steps are not skipped** unless the event has started (then they are marked `skipped`).

## 5. Time zones

An event is a local date + time + IANA zone. Each step is "N days before the event date at HH:MM local", converted to UTC on save, so it stays at the same wall-clock time across a daylight-saving change. Steps must be strictly increasing and before the event starts; at launch they must also be in the future.

## 6. Unsubscribe links

All links built by the mailer (one-off and drip) now carry `&token=<HMAC>` when `UNSUBSCRIBE_TOKEN_SECRET` is set. `/api/unsubscribe` verifies the token against the exact email and list, rejects a wrong token with 403, and performs the write with the server-side client.

**Limitation:** links in emails sent *before* this change have no token. To avoid breaking them, tokenless requests still work, which means the old forging weakness (anyone can unsubscribe a known address) still exists on that path. Once old emails are no longer a concern, set `UNSUBSCRIBE_REQUIRE_TOKEN=true` to close it.

## 7. Scope and known limits

- First version covers **event** sequences only. No onboarding automation, A/B tests, analytics dashboards or auto-enrollment.
- Recipients are picked exactly as in the one-off composer (type/paste addresses or use "Load from Contacts"). On every save the server matches each address to an existing contact; addresses that are not contacts, or whose contact is unsubscribed, are skipped and reported. The audience is a snapshot taken each time you save the draft. Contacts added later are not enrolled; contacts who unsubscribe later are skipped at send time.
- Being a `subscribed` contact is not proof of marketing consent. The tool relies on you choosing an appropriate audience and on existing unsubscribe suppression.
- Campaign content is editable only while `draft`. To change a launched campaign, cancel it and create a new one.
- Delivery status is "accepted by Resend". Bounces/complaints are not tracked.

## 8. Tests

`npm test` (Vitest). No test touches the network or a database; the email provider is mocked. The worker tests run against an in-memory model of the SQL (`src/__tests__/helpers/fake-drip-store.ts`), so they verify the TypeScript decision logic, **not the SQL functions**. Exercise `drip_claim_due` / `drip_finish_send` against a real Postgres (e.g. a Supabase branch) before relying on them.
