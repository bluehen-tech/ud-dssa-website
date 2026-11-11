-- ============================================================================
-- Drip campaigns (event email sequences)
-- Run once in Supabase Dashboard -> SQL Editor. Review before running; this
-- file is NOT applied automatically.
--
-- Assumes: public.contacts(id uuid), public.profiles(id uuid, admin_flag bool),
-- and auth.users already exist.
--
-- Access model: the browser never writes these tables. All writes go through
-- Next.js API routes (admin-checked) or the cron worker, both using the
-- service-role key (which bypasses RLS). RLS below only lets admins READ.
-- ============================================================================

-- ── Campaigns ───────────────────────────────────────────────────────────────
create table if not exists drip_campaigns (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 120),
  email_type       text not null default 'event'
                     check (email_type in ('newsletter','event','opportunity','announcement')),
  event_title      text not null,
  event_date       date not null,                 -- local calendar date of the event
  event_time       time not null,                 -- local start time
  timezone         text not null,                 -- IANA zone, e.g. America/New_York
  event_starts_at  timestamptz not null,          -- derived from the three above
  goal             text,
  brief            jsonb not null default '{}'::jsonb,           -- generation context
  audience_filter  jsonb not null default '{}'::jsonb,           -- {recipients: ["Name <email>", ...]} as entered
  status           text not null default 'draft'
                     check (status in ('draft','active','paused','completed','cancelled')),
  created_by       uuid references auth.users(id) on delete set null,
  launched_at      timestamptz,
  paused_at        timestamptz,
  cancelled_at     timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_drip_campaigns_status on drip_campaigns(status);

-- ── Steps (the emails) ──────────────────────────────────────────────────────
create table if not exists drip_campaign_steps (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references drip_campaigns(id) on delete cascade,
  position       int  not null check (position >= 1),
  stage          text not null
                   check (stage in ('save-the-date','full-details','reminder','last-chance')),
  subject        text not null,
  body_markdown  text not null,
  offset_days    int  not null check (offset_days between -365 and 0), -- days before event date
  send_time      time not null,                                         -- local wall-clock time
  send_at        timestamptz not null,                                  -- derived, DST-safe
  approved_at    timestamptz,                                           -- human approval
  approved_by    uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (campaign_id, position)
);
create index if not exists idx_drip_steps_due on drip_campaign_steps(campaign_id, send_at);

-- ── Enrollments (audience snapshot, one row per contact per campaign) ───────
create table if not exists drip_enrollments (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references drip_campaigns(id) on delete cascade,
  contact_id     uuid not null references contacts(id) on delete cascade,
  status         text not null default 'active'
                   check (status in ('active','completed','unsubscribed','failed','held','stopped')),
  next_position  int  not null default 1,        -- the step this contact receives next
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (campaign_id, contact_id)
);
create index if not exists idx_drip_enrollments_due
  on drip_enrollments(campaign_id, status, next_position);

-- ── Sends (one row per recipient per step = the delivery attempt) ───────────
create table if not exists drip_sends (
  id                    uuid primary key default gen_random_uuid(),
  campaign_id           uuid not null references drip_campaigns(id) on delete cascade,
  step_id               uuid not null references drip_campaign_steps(id) on delete cascade,
  enrollment_id         uuid not null references drip_enrollments(id) on delete cascade,
  status                text not null default 'sending'
                          check (status in ('sending','sent','failed','skipped','uncertain')),
  attempts              int  not null default 1,
  claimed_at            timestamptz not null default now(),
  provider_requested_at timestamptz,   -- set once a provider request may have been made
  completed_at          timestamptz,
  provider_message_id   text,
  error                 text,
  -- The guarantee against duplicates: a recipient can have at most one send per step.
  unique (enrollment_id, step_id)
);
create index if not exists idx_drip_sends_stale
  on drip_sends(claimed_at) where status = 'sending';
create index if not exists idx_drip_sends_campaign on drip_sends(campaign_id, step_id, status);

-- ── Row Level Security: admins may read; nobody writes from the browser ─────
alter table drip_campaigns      enable row level security;
alter table drip_campaign_steps enable row level security;
alter table drip_enrollments    enable row level security;
alter table drip_sends          enable row level security;

do $$
declare t text;
begin
  foreach t in array array['drip_campaigns','drip_campaign_steps','drip_enrollments','drip_sends'] loop
    execute format('drop policy if exists "Admins can read %1$s" on %1$I', t);
    execute format(
      'create policy "Admins can read %1$s" on %1$I for select to authenticated
         using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.admin_flag = true))',
      t);
  end loop;
end $$;

-- ── Save (create or replace a draft) — atomic, row-locked ───────────────────
create or replace function drip_save_campaign(
  p_campaign_id uuid,
  p_user_id uuid,
  p_campaign jsonb,
  p_steps jsonb,
  p_contact_ids uuid[]
) returns uuid
language plpgsql
as $$
declare v_id uuid := p_campaign_id;
begin
  if v_id is null then
    insert into drip_campaigns
      (name, email_type, event_title, event_date, event_time, timezone, event_starts_at,
       goal, brief, audience_filter, created_by)
    values
      (p_campaign->>'name', p_campaign->>'email_type', p_campaign->>'event_title',
       (p_campaign->>'event_date')::date, (p_campaign->>'event_time')::time,
       p_campaign->>'timezone', (p_campaign->>'event_starts_at')::timestamptz,
       nullif(p_campaign->>'goal',''), coalesce(p_campaign->'brief','{}'::jsonb),
       coalesce(p_campaign->'audience_filter','{}'::jsonb), p_user_id)
    returning id into v_id;
  else
    update drip_campaigns set
      name = p_campaign->>'name',
      email_type = p_campaign->>'email_type',
      event_title = p_campaign->>'event_title',
      event_date = (p_campaign->>'event_date')::date,
      event_time = (p_campaign->>'event_time')::time,
      timezone = p_campaign->>'timezone',
      event_starts_at = (p_campaign->>'event_starts_at')::timestamptz,
      goal = nullif(p_campaign->>'goal',''),
      brief = coalesce(p_campaign->'brief','{}'::jsonb),
      audience_filter = coalesce(p_campaign->'audience_filter','{}'::jsonb),
      updated_at = now()
    where id = v_id and status = 'draft';
    if not found then
      raise exception 'campaign_not_draft';
    end if;
  end if;

  delete from drip_campaign_steps where campaign_id = v_id;
  delete from drip_enrollments    where campaign_id = v_id;

  insert into drip_campaign_steps
    (campaign_id, position, stage, subject, body_markdown, offset_days, send_time, send_at,
     approved_at, approved_by)
  select v_id, (s->>'position')::int, s->>'stage', s->>'subject', s->>'body_markdown',
         (s->>'offset_days')::int, (s->>'send_time')::time, (s->>'send_at')::timestamptz,
         nullif(s->>'approved_at','')::timestamptz, nullif(s->>'approved_by','')::uuid
  from jsonb_array_elements(p_steps) s;

  insert into drip_enrollments (campaign_id, contact_id)
  select v_id, c from unnest(p_contact_ids) c
  on conflict (campaign_id, contact_id) do nothing;

  return v_id;
end $$;

-- ── Launch — re-validates under a row lock ───────────────────────────────────
create or replace function drip_launch_campaign(p_campaign_id uuid)
returns void
language plpgsql
as $$
declare c drip_campaigns;
begin
  select * into c from drip_campaigns where id = p_campaign_id for update;
  if not found then raise exception 'campaign_not_found'; end if;
  if c.status <> 'draft' then raise exception 'invalid_state'; end if;

  if c.event_starts_at <= now()
     or not exists (select 1 from drip_campaign_steps where campaign_id = c.id)
     or exists (select 1 from drip_campaign_steps
                where campaign_id = c.id and (approved_at is null or send_at <= now()))
     or not exists (select 1 from drip_enrollments where campaign_id = c.id)
  then
    raise exception 'launch_not_ready';
  end if;

  update drip_campaigns
     set status = 'active', launched_at = now(), updated_at = now()
   where id = c.id;
end $$;

-- ── Close out campaigns with nothing left to do ──────────────────────────────
create or replace function drip_complete_finished_campaigns()
returns void
language sql
as $$
  update drip_campaigns c
     set status = 'completed', completed_at = now(), updated_at = now()
   where c.status = 'active'
     and not exists (select 1 from drip_enrollments e where e.campaign_id = c.id and e.status = 'active');
$$;

-- ── Claim due work ───────────────────────────────────────────────────────────
-- Returns the drip_sends rows this call now owns. Safe under concurrent calls:
--   * stale claims are re-claimed with FOR UPDATE SKIP LOCKED
--   * new claims lock the enrollment row (SKIP LOCKED) and insert into drip_sends,
--     where UNIQUE (enrollment_id, step_id) makes a duplicate claim impossible.
create or replace function drip_claim_due(
  p_limit int default 20,
  p_lease_minutes int default 10,
  p_max_attempts int default 3,
  p_max_key_age_hours int default 20
) returns setof drip_sends
language plpgsql
as $$
declare
  v_reclaimed uuid[] := '{}';
  v_remaining int;
begin
  -- 1. Give up on stale claims that hit the retry cap, or whose provider
  --    request is older than the provider's idempotency window. Never resend
  --    those: if a request may have been made, the outcome is "uncertain".
  with stale as (
    select id from drip_sends
    where status = 'sending'
      and claimed_at < now() - make_interval(mins => p_lease_minutes)
      and (attempts >= p_max_attempts
           or (provider_requested_at is not null
               and provider_requested_at < now() - make_interval(hours => p_max_key_age_hours)))
    for update skip locked
  ), gave_up as (
    update drip_sends s
       set status = case when s.provider_requested_at is null then 'failed' else 'uncertain' end,
           error = left(coalesce(s.error || ' | ', '') || 'gave up after retries', 500),
           completed_at = now()
      from stale
     where s.id = stale.id
    returning s.enrollment_id, s.status
  )
  update drip_enrollments e
     set status = case when g.status = 'failed' then 'failed' else 'held' end,
         updated_at = now()
    from gave_up g
   where e.id = g.enrollment_id;

  -- 2. Re-claim stale sends of active campaigns (retry with the same send id,
  --    hence the same provider idempotency key).
  with stale as (
    select s.id from drip_sends s
    join drip_campaigns c on c.id = s.campaign_id and c.status = 'active'
    where s.status = 'sending'
      and s.claimed_at < now() - make_interval(mins => p_lease_minutes)
    order by s.claimed_at
    limit p_limit
    for update of s skip locked
  ), upd as (
    update drip_sends s
       set claimed_at = now(), attempts = s.attempts + 1
      from stale
     where s.id = stale.id
    returning s.id
  )
  select coalesce(array_agg(id), '{}') into v_reclaimed from upd;

  v_remaining := p_limit - cardinality(v_reclaimed);

  if cardinality(v_reclaimed) > 0 then
    return query select * from drip_sends where id = any(v_reclaimed);
  end if;

  -- 3. Claim new due work: active campaign, active enrollment, its next step is due.
  if v_remaining > 0 then
    return query
    with due as (
      select e.id as enrollment_id, e.campaign_id, st.id as step_id
      from drip_enrollments e
      join drip_campaigns c on c.id = e.campaign_id and c.status = 'active'
      join drip_campaign_steps st on st.campaign_id = e.campaign_id and st.position = e.next_position
      where e.status = 'active'
        and st.send_at <= now()
        and not exists (select 1 from drip_sends d where d.enrollment_id = e.id and d.step_id = st.id)
      order by st.send_at, e.id
      limit v_remaining
      for update of e skip locked
    ), ins as (
      insert into drip_sends (campaign_id, step_id, enrollment_id)
      select campaign_id, step_id, enrollment_id from due
      on conflict (enrollment_id, step_id) do nothing
      returning *
    )
    select * from ins;
  end if;

  perform drip_complete_finished_campaigns();
end $$;

-- ── Finish a send and advance the enrollment — one transaction ──────────────
-- p_status: sent | failed | skipped | uncertain | released
--   sent       -> advance to the next step (or complete)
--   skipped    -> advance if p_enrollment_status is null, else stop with that status
--   failed     -> stop the enrollment ('failed')
--   uncertain  -> hold the enrollment ('held'); NOT retried automatically
--   released   -> caller asserts nothing was delivered; row is deleted so it can be re-claimed
-- Only acts on rows still in 'sending', so repeating a call is harmless.
create or replace function drip_finish_send(
  p_send_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error text default null,
  p_enrollment_status text default null
) returns boolean
language plpgsql
as $$
declare
  v_send drip_sends;
  v_max int;
begin
  if p_status not in ('sent','failed','skipped','uncertain','released') then
    raise exception 'invalid status %', p_status;
  end if;

  select * into v_send from drip_sends where id = p_send_id and status = 'sending' for update;
  if not found then return false; end if;

  if p_status = 'released' then
    delete from drip_sends where id = p_send_id;
    return true;
  end if;

  update drip_sends
     set status = p_status,
         provider_message_id = p_provider_message_id,
         error = left(p_error, 500),
         completed_at = now()
   where id = p_send_id;

  if p_status = 'sent' or (p_status = 'skipped' and p_enrollment_status is null) then
    select max(position) into v_max from drip_campaign_steps where campaign_id = v_send.campaign_id;
    update drip_enrollments
       set next_position = next_position + 1,
           status = case when next_position + 1 > v_max then 'completed' else status end,
           updated_at = now()
     where id = v_send.enrollment_id and status = 'active';
  else
    update drip_enrollments
       set status = coalesce(p_enrollment_status,
                             case p_status when 'failed' then 'failed' else 'held' end),
           updated_at = now()
     where id = v_send.enrollment_id and status = 'active';
  end if;

  perform drip_complete_finished_campaigns();
  return true;
end $$;

-- ── Per-campaign counts for the admin UI ─────────────────────────────────────
create or replace function drip_campaign_stats(p_campaign_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'enrollments', coalesce((select jsonb_object_agg(status, n) from
        (select status, count(*) n from drip_enrollments where campaign_id = p_campaign_id group by status) e), '{}'::jsonb),
    'sends', coalesce((select jsonb_object_agg(status, n) from
        (select status, count(*) n from drip_sends where campaign_id = p_campaign_id group by status) s), '{}'::jsonb)
  );
$$;

-- ── Lock the functions down to the service role ──────────────────────────────
revoke all on function drip_save_campaign(uuid, uuid, jsonb, jsonb, uuid[])       from public, anon, authenticated;
revoke all on function drip_launch_campaign(uuid)                                 from public, anon, authenticated;
revoke all on function drip_complete_finished_campaigns()                         from public, anon, authenticated;
revoke all on function drip_claim_due(int, int, int, int)                         from public, anon, authenticated;
revoke all on function drip_finish_send(uuid, text, text, text, text)             from public, anon, authenticated;
revoke all on function drip_campaign_stats(uuid)                                  from public, anon, authenticated;

grant execute on function drip_save_campaign(uuid, uuid, jsonb, jsonb, uuid[])    to service_role;
grant execute on function drip_launch_campaign(uuid)                              to service_role;
grant execute on function drip_complete_finished_campaigns()                      to service_role;
grant execute on function drip_claim_due(int, int, int, int)                      to service_role;
grant execute on function drip_finish_send(uuid, text, text, text, text)          to service_role;
grant execute on function drip_campaign_stats(uuid)                               to service_role;
