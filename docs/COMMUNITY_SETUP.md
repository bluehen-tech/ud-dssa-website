# Community Feature Setup

This guide adds the Supabase tables, triggers, RLS policies, and storage bucket used by the `/community` page.

## What The App Expects

- `community_posts`: posts, tags, media metadata, pin status, vote/comment counters
- `community_comments`: threaded comments with `parent_id`
- `community_votes`: one upvote per user per post or comment
- `community_reports`: member reports for admin review
- Storage bucket: `community-media` for JPEG, PNG, and MP4 uploads

The app reads posts/comments for visitors, but creating posts, commenting, voting, uploading media, and reporting require an authenticated `@udel.edu` session. Admin moderation uses `profiles.admin_flag`.

## SQL

Run this in the Supabase SQL Editor.

```sql
create extension if not exists pgcrypto;

create or replace function public.community_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select admin_flag from public.profiles where id = auth.uid()),
    false
  );
$$;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  title text not null check (char_length(trim(title)) between 1 and 140),
  content text not null default '',
  tags text[] not null default '{}',
  media_url text,
  media_path text,
  media_type text check (media_type in ('image', 'video', 'embed') or media_type is null),
  media_name text,
  is_pinned boolean not null default false,
  vote_count integer not null default 0 check (vote_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  parent_id uuid references public.community_comments(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  content text not null check (char_length(trim(content)) between 1 and 6000),
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  check (parent_id is null or parent_id <> id)
);

create table if not exists public.community_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  vote_type text not null default 'upvote' check (vote_type = 'upvote'),
  created_at timestamptz not null default now(),
  check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  unique (user_id, post_id),
  unique (user_id, comment_id)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reason text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check (
    (target_type = 'post' and post_id is not null and comment_id is null) or
    (target_type = 'comment' and post_id is null and comment_id is not null)
  )
);

create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_pinned_created_idx on public.community_posts (is_pinned desc, created_at desc);
create index if not exists community_posts_tags_idx on public.community_posts using gin (tags);
create index if not exists community_comments_post_created_idx on public.community_comments (post_id, created_at asc);
create index if not exists community_comments_parent_idx on public.community_comments (parent_id);
create index if not exists community_votes_post_idx on public.community_votes (post_id);
create index if not exists community_votes_comment_idx on public.community_votes (comment_id);
create index if not exists community_reports_status_idx on public.community_reports (status, created_at desc);

create or replace function public.set_community_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
before update on public.community_posts
for each row execute function public.set_community_updated_at();

drop trigger if exists set_community_comments_updated_at on public.community_comments;
create trigger set_community_comments_updated_at
before update on public.community_comments
for each row execute function public.set_community_updated_at();

create or replace function public.sync_community_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.post_id is not null then
      update public.community_posts
      set vote_count = vote_count + 1
      where id = new.post_id;
    else
      update public.community_comments
      set vote_count = vote_count + 1
      where id = new.comment_id;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.post_id is not null then
      update public.community_posts
      set vote_count = greatest(vote_count - 1, 0)
      where id = old.post_id;
    else
      update public.community_comments
      set vote_count = greatest(vote_count - 1, 0)
      where id = old.comment_id;
    end if;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_community_vote_count on public.community_votes;
create trigger sync_community_vote_count
after insert or delete on public.community_votes
for each row execute function public.sync_community_vote_count();

create or replace function public.sync_community_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_posts
    set comment_count = comment_count + 1
    where id = new.post_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.community_posts
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.post_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_community_comment_count on public.community_comments;
create trigger sync_community_comment_count
after insert or delete on public.community_comments
for each row execute function public.sync_community_comment_count();

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_votes enable row level security;
alter table public.community_reports enable row level security;

drop policy if exists "Community posts are public" on public.community_posts;
create policy "Community posts are public"
  on public.community_posts for select
  using (true);

drop policy if exists "Members can create community posts" on public.community_posts;
create policy "Members can create community posts"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Admins can update community posts" on public.community_posts;
create policy "Admins can update community posts"
  on public.community_posts for update
  to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());

drop policy if exists "Authors and admins can delete community posts" on public.community_posts;
create policy "Authors and admins can delete community posts"
  on public.community_posts for delete
  to authenticated
  using (auth.uid() = author_id or public.community_is_admin());

drop policy if exists "Community comments are public" on public.community_comments;
create policy "Community comments are public"
  on public.community_comments for select
  using (true);

drop policy if exists "Members can create community comments" on public.community_comments;
create policy "Members can create community comments"
  on public.community_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors and admins can delete community comments" on public.community_comments;
create policy "Authors and admins can delete community comments"
  on public.community_comments for delete
  to authenticated
  using (auth.uid() = author_id or public.community_is_admin());

drop policy if exists "Members can read own community votes" on public.community_votes;
create policy "Members can read own community votes"
  on public.community_votes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Members can create own community votes" on public.community_votes;
create policy "Members can create own community votes"
  on public.community_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Members can delete own community votes" on public.community_votes;
create policy "Members can delete own community votes"
  on public.community_votes for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Members can create community reports" on public.community_reports;
create policy "Members can create community reports"
  on public.community_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Admins can read community reports" on public.community_reports;
create policy "Admins can read community reports"
  on public.community_reports for select
  to authenticated
  using (public.community_is_admin());

drop policy if exists "Admins can update community reports" on public.community_reports;
create policy "Admins can update community reports"
  on public.community_reports for update
  to authenticated
  using (public.community_is_admin())
  with check (public.community_is_admin());

drop policy if exists "Admins can delete community reports" on public.community_reports;
create policy "Admins can delete community reports"
  on public.community_reports for delete
  to authenticated
  using (public.community_is_admin());
```

## Storage Bucket

Run this after the tables are created. The app defaults to `community-media`; override with `SUPABASE_COMMUNITY_MEDIA_BUCKET` only if you choose a different bucket name.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  26214400,
  array['image/jpeg', 'image/png', 'video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Community media public read" on storage.objects;
create policy "Community media public read"
  on storage.objects for select
  using (bucket_id = 'community-media');

drop policy if exists "Community members upload own media" on storage.objects;
create policy "Community members upload own media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Community members delete own media" on storage.objects;
create policy "Community members delete own media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'community-media'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.community_is_admin()
    )
  );
```

## API Routes

- `GET /api/community/posts`
- `POST /api/community/posts`
- `PATCH /api/community/posts/:id`
- `DELETE /api/community/posts/:id`
- `GET /api/community/posts/:id/comments`
- `POST /api/community/posts/:id/comments`
- `DELETE /api/community/comments/:id`
- `POST /api/community/votes`
- `POST /api/community/media`
- `POST /api/community/reports`
