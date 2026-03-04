# Member Portfolios - End-to-End Plan

This document describes the **current state** of the UD-DSSA website, the **target design** for the member portfolios feature (member-editable, admin-approved, RLS-secured), and a **step-by-step implementation plan**. No code changes are made by this doc; it is the single reference for the feature.

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Target Feature: Member Portfolios](#2-target-feature-member-portfolios)
3. [Data Model](#3-data-model)
4. [Security (RLS)](#4-security-rls)
5. [Status Workflow & Who Can Do What](#5-status-workflow--who-can-do-what)
6. [Implementation Plan](#6-implementation-plan)
7. [SQL Reference](#7-sql-reference)
8. [File & Folder Changes](#8-file--folder-changes)
9. [Open Decisions & Notes](#9-open-decisions--notes)
10. [Professional UX Additions (MVP vs Phase 2)](#10-professional-ux-additions-mvp-vs-phase-2)

---

## 1. Current State

### 1.1 Tech Stack

| Layer        | Technology |
|-------------|------------|
| Framework   | Next.js 14 (App Router), React 18, TypeScript |
| Styling     | Tailwind CSS |
| Backend     | Next.js Route Handlers (`src/app/api/`), no separate server |
| Auth & DB   | Supabase (Auth, PostgreSQL, Storage) |
| Auth flow   | Magic link (OTP) with PKCE, `@udel.edu` only |
| Session     | 4-hour cap (client + middleware), admin via `profiles.admin_flag` |

### 1.2 Existing Supabase Tables

| Table                        | Purpose |
|-----------------------------|---------|
| `profiles`                  | Auth/profile table with columns `id`, `email`, `admin_flag`, `created_at`. RLS: users can read/update own; cannot change `admin_flag` or `email`. |
| `contacts`                  | Central contact list (form submissions, auth users, CSV import). Admin CRUD via API. |
| `form_submissions`          | Public "Get Connected" form submissions. Synced into `contacts`. |
| `events`                    | Events with optional flyer (storage bucket `events`). Authenticated users can add. |
| `opportunities`             | Jobs/internships/etc. with optional attachment (storage bucket `opportunities`). |
| `applications`              | User applications to opportunities (`user_id`, `opportunity_id`, `resume_upload_id`, `status`). |
| `applications_with_user_info` | View (or table) joining applications with user/email for admin. |
| `opportunity_resumes`       | Resume uploads per user per opportunity. |
| `resumes`                   | Resume storage metadata; bucket `resumes`. |

Current DB functions: none (`Functions: 0`), so `is_admin` and `request_portfolio_approval` are part of this feature rollout.

### 1.3 Auth & Protection

- **Login:** `/login` -> magic link -> `/auth/confirm` (PKCE) -> session. Email must be `@udel.edu`.
- **Middleware** (`middleware.ts`): Protects `/officers`, `/email`, `/contacts`. (Note: app uses `/members`, not `/officers`; consider aligning.)
- **Admin:** `profiles.admin_flag` used in API for contacts, email send/generate. No separate roles table.

### 1.4 Current Members Section

- **Route:** `/members`
- **Data source:** Static data from `src/data/members/index.ts` (imports from `officers`, `members`, `alumni` arrays; currently empty/placeholder).
- **Type:** `MemberPortfolio` in `src/types/member.ts` (id, role, position, name, email, bio, tagline, major, graduationDate, profileImageUrl, skills, experience, education, projects, links, achievements, interests).
- **UI:** Tabs: Officers / Members / Alumni; grid of cards. No per-member detail page in codebase yet; template suggests `/members/[slug]`.
- **Editing:** None. Content is file-based (add/edit by changing repo files).

### 1.5 Relevant Frontend Structure

```
src/
  app/
    members/page.tsx          # Current members directory (static)
    login/page.tsx
    auth/confirm/route.ts
    api/                     # Contacts, email, submit-form, etc.
  contexts/AuthContext.tsx
  lib/supabase-browser.ts, supabase-server.ts, supabase-middleware.ts
  types/member.ts            # MemberPortfolio, Project, Experience, Education
  data/members/               # Static member data (index, _template)
```

---

## 2. Target Feature: Member Portfolios

### 2.1 Goals

- **Members** can create and edit **only their own** portfolio (no editing others).
- **Workflow:** Draft -> (user clicks Publish) -> Pending -> Admin approves -> Published, or Admin rejects -> Rejected (user can edit and resubmit).
- **Public** sees only **published** portfolios on `/members`.
- **Admins** (existing `profiles.admin_flag`) can approve or reject pending portfolios.
- **Richer form content:** Members can add structured **experience**, **projects** (with links), **skills**, and upload a **resume**.

### 2.2 Design Decisions (Updated)

1. **Separate table:** Use a new table **`member_portfolios`** (not extend `profiles`). Keeps auth/admin separate from portfolio content and simplifies RLS.
2. **Admin:** Reuse **`profiles.admin_flag`** for "who can approve/reject." No new `user_roles` table for now.
3. **Admin via RLS (recommended path):** Admin reads and approve/reject updates are authorized by RLS through `public.is_admin()`.
4. **Status transitions:** Owner cannot directly set `pending` or `published` (or approval fields). Owner submit-to-pending uses RPC `public.request_portfolio_approval()` (**SECURITY DEFINER**) that performs only `draft/rejected -> pending` for `auth.uid()`.
5. **Admin authority model:** API may check `profiles.admin_flag` for early reject and cleaner errors, but RLS is the final authority for admin reads/writes.

### 2.3 Status Pipeline

| Status     | Who sees it                    | Editable by owner | Next transitions (who) |
|------------|---------------------------------|-------------------|------------------------|
| `draft`    | Only owner                      | Yes               | Owner: -> `pending` (Publish request) |
| `pending`  | Owner + admins                  | No (locked)       | Admin: -> `published` or `rejected` |
| `published`| Public on `/members`            | No                | Optional future admin "unpublish" flow |
| `rejected` | Owner (+ optional admin note)   | Yes               | Owner: -> `pending` (Resubmit request) |

### 2.4 Portfolio UI (Public + Editor)

- `/members`: card directory showing published portfolios only.
- `/members/[id]`: public detail page for one published portfolio.
- `/members/me`: authenticated editor with current status banner (`draft`, `pending`, `rejected`, `published` behavior).
- `/admin/portfolios`: admin approval queue for pending portfolios.

Editor form sections (planned):

- **Basic info:** name, role, position, tagline, major, graduation date, bio, profile image.
- **Skills:** category + list of items (or flat list as a fallback).
- **Experience:** repeatable entries (title, organization, dates, location, responsibilities, achievements).
- **Projects:** repeatable entries (title, description, technologies, `githubUrl`, `liveUrl`, optional image URL).
- **Resume:** upload a resume file and attach it to the portfolio.

### 2.5 Member Form UX Standards (Professional + Easy)

- **Progress & guidance:** show completion progress (e.g. basic info complete, projects complete) and highlight missing required fields.
- **Draft-first safety:** auto-save or clear manual save action, unsaved changes warning before leaving page.
- **Preview before publish:** add preview mode matching public `/members/[id]` layout.
- **Helpful examples:** placeholder copy for bio, project descriptions, and achievement bullets.
- **Repeatable section controls:** add/remove/reorder for experience and projects.
- **Validation clarity:** inline validation messages for URL format, required fields, date ranges, and max lengths.
- **Accessibility:** keyboard-friendly controls, clear labels, and error summaries for screen readers.

### 2.6 Admin Review UX Standards (Fast + Consistent)

- **Review checklist:** basic quality checklist (bio clarity, links valid, no placeholder text, resume present if required).
- **Rejection templates:** prebuilt rejection reasons plus optional custom notes.
- **Resubmission diff:** show what changed since last rejected submission.
- **Queue efficiency:** filter/sort by submitted time, role, and completeness level.
- **Quick actions:** approve, reject, and open public preview in one panel.
- **Auditability:** track reviewer id and timestamp for approve/reject actions.

---

## 3. Data Model

### 3.1 New Table: `member_portfolios`

One row per user. `user_id` = `auth.uid()`.

| Column           | Type         | Notes |
|------------------|--------------|--------|
| `id`             | `uuid`       | PK, default `gen_random_uuid()` |
| `user_id`        | `uuid`       | UNIQUE NOT NULL, references `auth.users(id)` ON DELETE CASCADE |
| `role`           | `text`       | `'officer' \| 'member' \| 'alumni'` |
| `position`       | `text`       | Optional (e.g. officer title) |
| `name`           | `text`       | NOT NULL |
| `email`          | `text`       | Recommended: populate from auth/profile at create time, not user-editable |
| `tagline`        | `text`       | Optional short headline |
| `major`          | `text`       | Optional |
| `graduation_date`| `text`       | Optional (e.g. "May 2028") |
| `bio`            | `text`       | Optional |
| `profile_image_url` | `text`    | Optional (e.g. Supabase Storage URL) |
| `links`          | `jsonb`      | Optional `{ linkedin?, github?, website?, email? }` |
| `skills`         | `jsonb`      | Optional array of `{ category?, items[] }` |
| `experience`     | `jsonb`      | Optional array of experience objects |
| `education`      | `jsonb`      | Optional array of education objects |
| `projects`       | `jsonb`      | Optional array of project objects |
| `achievements`   | `jsonb`      | Optional array |
| `interests`      | `jsonb`      | Optional array |
| `resume_path`    | `text`       | Optional storage path to current resume |
| `resume_filename`| `text`       | Optional original filename |
| `resume_updated_at` | `timestamptz` | Optional last resume upload time |
| `resume_mime`    | `text`       | Optional resume MIME type |
| `resume_size`    | `bigint`     | Optional resume size in bytes |
| `status`         | `text`       | NOT NULL, default `'draft'`. Values: `draft`, `pending`, `published`, `rejected` |
| `submitted_at`   | `timestamptz`| When user last requested publish |
| `approved_at`    | `timestamptz`| When admin approved |
| `approved_by`    | `uuid`       | Admin user id who approved |
| `rejection_reason`| `text`      | Optional; set when admin sets `rejected` |
| `created_at`     | `timestamptz`| default `now()` |
| `updated_at`     | `timestamptz`| default `now()`, updated on change |

Indexes (recommended):

- `member_portfolios_user_id_key` (UNIQUE on `user_id`)
- `member_portfolios_status_idx` on `(status)` for listing published / pending
- Optional: `member_portfolios_updated_at_idx` for "recent" listings

### 3.2 Aligning With Existing `MemberPortfolio` Type

The existing `src/types/member.ts` `MemberPortfolio` interface can stay as the **frontend/display** shape. Map to/from DB as follows:

- DB uses snake_case and `jsonb` for nested structures (skills, experience, education, projects, links, achievements, interests).
- Add DB-specific fields to a type (e.g. `MemberPortfolioRow`) or extend the existing type with `status`, `submitted_at`, `approved_at`, `approved_by`, `rejection_reason` for admin/owner views.

### 3.3 Email Sync Strategy

- On create, derive `member_portfolios.email` server-side from the authenticated user context (prefer `profiles.email`, fallback to `auth.getUser().email`).
- Treat portfolio email as non-editable in normal owner updates.
- If "hide email" is needed later, add a separate boolean (e.g. `show_email`) rather than letting users write arbitrary email values.

### 3.4 Resume Storage Strategy

- Use Supabase Storage bucket (recommended: `member-resumes`) for PDF/DOC/DOCX uploads.
- Store file path in Storage by user-scoped key, e.g. `<user_id>/<timestamp>-<filename>`.
- Persist `resume_path`, `resume_filename`, `resume_updated_at`, `resume_mime`, and `resume_size` in `member_portfolios`.
- Owner can replace their resume while in `draft`/`rejected`; API should delete/overwrite old file safely.
- Public display can show a "View Resume" link on `/members/[id]` only when portfolio is published.

---

## 4. Security (RLS)

### 4.1 Principles

- **Own row:** User can INSERT/UPDATE/DELETE only where `auth.uid() = user_id`.
- **Public read:** Only rows with `status = 'published'` are visible to anonymous and non-owner users.
- **Admin actions with normal session:** Admin reads and approve/reject updates are enforced in RLS via `public.is_admin()` (reads `profiles.admin_flag`).
- **Publish request is controlled:** Owner submit-to-pending happens only through `public.request_portfolio_approval()` RPC (**SECURITY DEFINER**, `search_path` pinned to `public`), not via direct client UPDATE. **Important:** In Postgres/Supabase, RLS still applies to the UPDATE executed inside the RPC unless the function explicitly bypasses RLS (not recommended). So we allow the transition via a **narrow RLS policy** (Option A): one policy that permits the owner to set `status = 'pending'` only when current status is `draft` or `rejected`, with `approved_at`/`approved_by` remaining null. Then the RPC works reliably and the table stays safe.
- **Security definer safety:** The publish RPC must stay tightly scoped: update only `where user_id = auth.uid()`, keep `search_path` pinned, and grant execute only to `authenticated`.

This ensures "pending is locked" and prevents direct client writes like `status='published'`, `approved_at`, or `approved_by`.

### 4.2 Recommended RLS Policies

- **SELECT**
  - Public: `status = 'published'`.
  - Owner: always see own row (`auth.uid() = user_id`) across `draft`, `pending`, `rejected`, and `published`.
  - Admin: can read pending via `public.is_admin() and status = 'pending'`. This is sufficient for the approval queue. If later you want admins to see rejected or published rows in the dashboard, add another admin SELECT policy (e.g. `using (public.is_admin())` with no status filter).
- **INSERT**
  - Authenticated owner can insert own row, constrained to draft and null approval fields.
- **UPDATE**
  - **Owner – two policies (both required):**
    - **Content-only:** Owner can update own row when current status is `draft` or `rejected`; WITH CHECK ensures the new row still has `status in ('draft','rejected')` and approval fields null (so they cannot set `status = 'pending'` or touch approval fields via a normal UPDATE).
    - **Request approval only:** A separate, narrow policy allows the owner to perform exactly the transition `draft/rejected -> pending`: USING `auth.uid() = user_id and status in ('draft','rejected')`, WITH CHECK `auth.uid() = user_id and status = 'pending' and approved_at is null and approved_by is null`. This is what makes the `request_portfolio_approval()` RPC succeed under RLS without bypassing RLS.
  - Admin can update pending rows for approve/reject actions; admin approve/reject routes update status/approval fields only (not portfolio content).
- **DB vs API:** DB policies enforce row ownership and status-based editing. The API must strip/block system columns (e.g. `submitted_at`, `approved_at`, `approved_by`, `rejection_reason`, `email`) on owner updates, while allowing controlled resume fields (`resume_path`, `resume_filename`, `resume_updated_at`, `resume_mime`, `resume_size`) from authenticated owner upload flows. An optional DB trigger can hard-block system fields later if desired.
- **DELETE**
  - Optional: owner can delete own row (`auth.uid() = user_id`).

Exact SQL is in [Section 7](#7-sql-reference).

---

## 5. Status Workflow & Who Can Do What

### 5.1 User (Owner) Actions

- **Create portfolio:** INSERT one row with `user_id = auth.uid()`, `status = 'draft'`, approval fields null.
- **Edit portfolio:** UPDATE own row when current status is `draft` or `rejected`. Content fields only.
- **Publish (request approval):** Call `rpc('request_portfolio_approval')` to move `draft/rejected -> pending`, set `submitted_at = now()`, and clear `rejection_reason`.
- **Resubmit after rejection:** Same RPC call.

### 5.2 Admin Actions

- **List pending:** GET portfolios where `status = 'pending'` (admin only).
- **Approve:** UPDATE row set `status = 'published'`, `approved_at = now()`, `approved_by = auth.uid()`, `rejection_reason = null`.
- **Reject:** UPDATE row set `status = 'rejected'`, `rejection_reason = <optional text>`, and clear `approved_at` + `approved_by`.

All admin actions run in API routes that verify `profiles.admin_flag`; RLS also enforces admin capability using `public.is_admin()`.

---

## 6. Implementation Plan

### Phase 1 - Database

1. Add migration (or SQL script) that:
   - Creates `member_portfolios` table with columns above.
   - Adds indexes and unique constraint on `user_id`.
   - Enables RLS.
   - Adds helper SQL functions `public.is_admin()` and `public.request_portfolio_approval()`.
   - Creates policies from Section 7.
   - Adds optional triggers.
2. Run in Supabase (SQL Editor or CLI).
3. Optionally generate TypeScript types from Supabase for `member_portfolios`.

### Phase 2 - API Routes

1. **GET `/api/member-portfolios/me`**  
   - Auth required. Return current user's portfolio row (if any). Used by `/members/me`.

2. **POST `/api/member-portfolios`**  
   - Auth required. Insert one row with `user_id = auth.uid()`, `status = 'draft'`, approval fields null, and `email` from auth/profile.

3. **PATCH `/api/member-portfolios/me`**  
  - Auth required. Update owner content only. Do not accept `status`, `approved_at`, `approved_by`.
  - Include support for nested `skills`, `experience`, `projects`, and resume metadata fields.

4. **POST `/api/member-portfolios/me/request-approval`**  
   - Auth required. Call `supabase.rpc('request_portfolio_approval')`.

4.5 **POST `/api/member-portfolios/me/resume`**  
  - Auth required. Upload/replace owner resume in Storage and update `resume_path`, `resume_filename`, `resume_updated_at`, `resume_mime`, `resume_size`.
  - Restrict file type/size server-side and return metadata for UI refresh.
  - Recommended: allow remove action (`DELETE /api/member-portfolios/me/resume`) to clear resume fields when user wants to replace later.

5. **GET `/api/member-portfolios`**  
   - Public or auth. Return rows where `status = 'published'` only. Optional query: `?role=officer|member|alumni`.

6. **GET `/api/member-portfolios/[id]`**  
   - Public or auth. Return a single portfolio by id only if `status = 'published'`.

7. **GET `/api/member-portfolios/pending`**  
   - Admin only. Return rows where `status = 'pending'`.

8. **POST `/api/member-portfolios/[id]/approve`**  
   - Admin only. Set `status = 'published'`, set `approved_at`, set `approved_by`, and clear `rejection_reason`.

9. **POST `/api/member-portfolios/[id]/reject`**  
   - Admin only. Set `status = 'rejected'`, set `rejection_reason` (optional), clear `approved_at`, and clear `approved_by`.

Auth from cookies via `createClient()` from `@/lib/supabase-server`; API can check `profiles.admin_flag` for early reject, but RLS remains the final authority for both owner and admin behavior.

### Phase 3 - My Portfolio Page (`/members/me`)

1. **Route:** `src/app/members/me/page.tsx` (protected: require auth; redirect to `/login` if not logged in).
2. **Behavior:**
   - Fetch `GET /api/member-portfolios/me`.
   - If no row: auto-create a blank draft row on first visit (optional but recommended), otherwise show "Create my portfolio" form (POST draft).
   - If row exists and `status IN ('draft', 'rejected')`: show edit form + "Publish" button (calls request-approval).
   - If `status = 'pending'`: show "Pending approval" message and optional admin feedback.
   - If `status = 'published'`: show read-only view (or optional future request-change flow).
3. **Form:** Reuse structure from `MemberPortfolio` / `_template.ts` and add richer, repeatable sections:
  - Skills editor (categories + items)
  - Experience editor (add/remove/reorder entries)
  - Projects editor (add/remove/reorder entries with GitHub/live links)
  - Resume upload section (PDF/DOC/DOCX) with replace/remove behavior
  - Completion indicator + publish readiness checks (required fields + validation status)
  - Keep image upload to Supabase Storage and set `profile_image_url`.

### Phase 4 - Members Directory (`/members`)

1. **Data source:** Switch from static `src/data/members` to `GET /api/member-portfolios` (published only).
2. **UI:** Keep tabs Officers / Members / Alumni; filter by `role`.
3. **Link "Edit my portfolio":** Show when logged in; link to `/members/me`.
4. **Phase 4.5 (recommended):** Add detail page `/members/[id]` first (simplest, unique).
5. **Optional later:** Add slug route `/members/[slug]` as UX polish.

### Phase 5 - Admin: Pending Approvals

1. **Route:** e.g. `/admin/portfolios` (admin only).
2. **UI:** List pending portfolios from `GET /api/member-portfolios/pending`. Add Approve / Reject actions.
3. **Actions:** Call approve/reject endpoints and refresh list.

4. **Review quality tools (recommended):**
  - Add reusable rejection reason templates.
  - Add one-click link checks (lightweight HEAD/URL format checks) for portfolio links.
  - Add resubmission change summary (at least "updated_at" + changed sections list in MVP, full diff later).

### Phase 6 - Deprecate Static Data (Optional)

- Once all portfolios are in Supabase, remove or stop using `src/data/members` imports for the directory. Keep `MemberPortfolio` type and `_template.ts` as form reference if helpful.

### Phase 7 - Professional UX Pass (Recommended)

1. Add portfolio preview mode in `/members/me`.
2. Add unsaved-change warning + save indicator.
3. Add completion score and publish readiness gating text.
4. Improve admin queue with filters, templates, and review checklist UI.
5. Add observability: log approve/reject outcomes and API error categories for support.

---

## 7. SQL Reference

### 7.1 Create Table

```sql
-- member_portfolios: one row per user, member-editable, status-driven visibility
create table public.member_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('officer', 'member', 'alumni')),
  position text,
  name text not null,
  email text,
  tagline text,
  major text,
  graduation_date text,
  bio text,
  profile_image_url text,
  links jsonb default '{}',
  skills jsonb default '[]',
  experience jsonb default '[]',
  education jsonb default '[]',
  projects jsonb default '[]',
  achievements jsonb default '[]',
  interests jsonb default '[]',
  resume_path text,
  resume_filename text,
  resume_updated_at timestamptz,
  resume_mime text,
  resume_size bigint,
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected')),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index member_portfolios_status_idx on public.member_portfolios(status);
create index member_portfolios_user_id_idx on public.member_portfolios(user_id);
-- optional: create index member_portfolios_updated_at_idx on public.member_portfolios(updated_at desc);
```

### 7.2 Functions + RLS Policies

```sql
alter table public.member_portfolios enable row level security;

-- Admin helper from profiles.admin_flag
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (select admin_flag from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Controlled owner transition: draft/rejected -> pending (SECURITY DEFINER)
create or replace function public.request_portfolio_approval()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.member_portfolios
  set status = 'pending',
      submitted_at = now(),
      rejection_reason = null
  where user_id = auth.uid()
    and status in ('draft', 'rejected');
end;
$$;

revoke all on function public.request_portfolio_approval() from public;
grant execute on function public.request_portfolio_approval() to authenticated;

-- Function owner should be a privileged role (default Supabase ownership is fine).
-- Safety guarantee: function only updates row where user_id = auth.uid().

-- 1) Public and authenticated can read published only
create policy "Public can read published portfolios"
on public.member_portfolios
for select
using (status = 'published');

-- 2) Owner can read own row (any status)
create policy "Owner can read own portfolio"
on public.member_portfolios
for select
to authenticated
using (auth.uid() = user_id);

-- 3) Admin can read pending (sufficient for approval queue; add broader admin SELECT later if needed)
create policy "Admin can read pending portfolios"
on public.member_portfolios
for select
to authenticated
using (public.is_admin() and status = 'pending');

-- 4) Owner can insert own row as draft
create policy "Owner can create own portfolio as draft"
on public.member_portfolios
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'draft'
  and approved_at is null
  and approved_by is null
);

-- 5a) Owner can edit content only when draft/rejected (must keep status draft/rejected)
-- Note: RLS is row-level; API must prevent updates to system columns (submitted_at, approved_at, approved_by, rejection_reason). Optional DB trigger can hard-block system fields later.
create policy "Owner can edit only draft/rejected (no publish fields)"
on public.member_portfolios
for update
to authenticated
using (auth.uid() = user_id and status in ('draft', 'rejected'))
with check (
  auth.uid() = user_id
  and status in ('draft', 'rejected')
  and approved_at is null
  and approved_by is null
);

-- 5b) Owner can request approval only: narrow transition draft/rejected -> pending (allows request_portfolio_approval() RPC to succeed under RLS)
create policy "Owner can request approval (draft/rejected -> pending only)"
on public.member_portfolios
for update
to authenticated
using (auth.uid() = user_id and status in ('draft', 'rejected'))
with check (
  auth.uid() = user_id
  and status = 'pending'
  and approved_at is null
  and approved_by is null
);

-- 6) Admin can approve/reject pending
drop policy if exists "Admin can update pending portfolios" on public.member_portfolios;

create policy "Admin can approve/reject pending portfolios"
on public.member_portfolios
for update
to authenticated
using (public.is_admin() and status = 'pending')
with check (
  public.is_admin()
  and status in ('published', 'rejected')
);

-- 7) Owner can delete own row (optional)
create policy "Users can delete own portfolio"
on public.member_portfolios
for delete
to authenticated
using (auth.uid() = user_id);
```

Optional data integrity checks (can be added later):

```sql
-- If published, approval fields must be present; otherwise they must be null
-- Reject must set approved_at = null and approved_by = null to satisfy this constraint.
alter table public.member_portfolios
add constraint member_portfolios_approval_fields_chk
check (
  (status = 'published' and approved_at is not null and approved_by is not null)
  or
  (status <> 'published' and approved_at is null and approved_by is null)
);
```

### 7.3 Trigger for `updated_at` (Optional)

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger member_portfolios_updated_at
before update on public.member_portfolios
for each row execute function public.set_updated_at();
```

---

## 8. File & Folder Changes

| Action  | Path / Item |
|---------|----------------|
| New     | `docs/MEMBER_PORTFOLIOS_PLAN.md` (this file) |
| New     | Supabase migration/SQL file (e.g. `supabase/migrations/YYYYMMDD_create_member_portfolios.sql`) |
| New     | `src/app/api/member-portfolios/route.ts` (GET published list) |
| New     | `src/app/api/member-portfolios/[id]/route.ts` (GET one published portfolio by id) |
| New     | `src/app/api/member-portfolios/me/route.ts` (GET/PATCH own portfolio) |
| New     | `src/app/api/member-portfolios/me/request-approval/route.ts` (POST RPC call) |
| New     | `src/app/api/member-portfolios/me/resume/route.ts` (POST upload/replace resume) |
| New     | Optional: `src/app/api/member-portfolios/me/resume/route.ts` DELETE handler (remove resume) |
| New     | `src/app/api/member-portfolios/pending/route.ts` (GET, admin) |
| New     | `src/app/api/member-portfolios/[id]/approve/route.ts` (POST, admin) |
| New     | `src/app/api/member-portfolios/[id]/reject/route.ts` (POST, admin) |
| New     | `src/app/members/me/page.tsx` (create/edit my portfolio) |
| New     | `src/app/members/[id]/page.tsx` (public single portfolio by id) |
| New     | Optional later: `src/app/members/[slug]/page.tsx` (slug UX polish) |
| New     | Optional: `src/app/admin/portfolios/page.tsx` (pending list + approve/reject) |
| Modify  | `src/app/members/page.tsx` - fetch from API (published only), keep tabs, add "Create/Edit my portfolio" for logged-in users |
| Modify  | `src/types/member.ts` - optional: add `status`, `submitted_at`, `approved_at`, `approved_by`, `rejection_reason` |
| Optional| `middleware.ts` - protect `/members/me` and admin routes if desired |

---

## 9. Open Decisions & Notes

- **Public detail route decision:** Start with `/members/[id]` (simple, unique). Add `/members/[slug]` later if needed for UX.
- **Image upload:** Store in Supabase Storage (e.g. bucket `member-portfolios`) with per-user path policy.
- **Resume upload:** Store in Supabase Storage (e.g. bucket `member-resumes`) with per-user path policy, file type/size limits, and replacement behavior.
- **Required fields for publish:** Decide a minimum publish checklist (e.g. name, role, bio, at least 1 skill, at least 1 experience or project).
- **Admin consistency:** Decide standard rejection templates and whether rejection reason is required.
- **Middleware path:** Current middleware protects `/officers` but app has `/members`. Decide middleware vs in-page/API checks for `/members/me` and admin routes.
- **Rejection reason visibility:** Show `rejection_reason` to owner on `/members/me` when `status = 'rejected'`.
- **Existing `profiles`:** Keep as-is for auth and `admin_flag`; portfolio content lives in `member_portfolios`.
- **Alternative model (not selected):** Service-role admin routes can bypass RLS, but require stricter server-only guardrails. Current plan keeps admin in RLS.

---

## 10. Professional UX Additions (MVP vs Phase 2)

This section prioritizes high-value improvements to keep scope controlled while making the product feel polished.

### 10.1 MVP (Ship First)

- Member form includes repeatable `experience`, `projects`, structured `skills`, and resume upload.
- Inline field validation with clear error text (URLs, required fields, file size/type).
- Publish button only enabled when minimum required fields are satisfied.
- Admin queue supports approve/reject + rejection note templates.
- Owner sees rejection reason clearly and can resubmit quickly.

### 10.2 Phase 2 (Polish + Efficiency)

- Member preview mode and unsaved-changes warning.
- Completion meter and section-level hints.
- Reorder controls for experience/projects.
- Admin filters/sorting and section-change summary on resubmissions.
- Link health checks for portfolio/project URLs.

### 10.3 Phase 3 (Advanced, Optional)

- Resume-assisted suggestions (extract skills/experience candidates, user confirms).
- Rich diff viewer between submitted versions.
- Optional moderation analytics (time-to-approval, rejection causes, completion drop-off).

---

**Document version:** 1.8  
**Last updated:** 2026-03-04  
**Changelog (1.8):** Added professional member/admin UX standards, prioritized MVP vs Phase 2 rollout, and expanded implementation notes for form quality, validation, review consistency, and usability safeguards.  
**Status:** Plan only; implementation to follow in phases above.



