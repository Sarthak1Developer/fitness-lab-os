-- Fitness LAB OS: Supabase schema + RLS
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1) Members table
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  user_id uuid,
  member_code text not null,
  full_name text not null,
  phone text not null,
  gender text,
  dob date,
  age int,
  goal text,
  nutrition_intervention text default 'No',
  readiness_trend text,
  health_category text default 'HEALTHY',
  phase text default 'UNCLASSIFIED',
  fms_total int,
  pain_nprs int,
  vo2_estimate numeric,
  movement_quality text,
  training_history text,
  status text default 'Active',
  renewal date,
  parq_answers jsonb default '{}'::jsonb,
  lifestyle_answers jsonb default '{}'::jsonb,
  exercise_history_answers jsonb default '{}'::jsonb,
  latest_readiness int,
  assessment_lab jsonb default '{}'::jsonb,
  plans jsonb default '[]'::jsonb,
  current_plan_id text,
  address text,
  email text,
  emergency_contact_name text,
  emergency_contact_number text,
  govt_id_type text,
  govt_id_number text,
  govt_id_file text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint members_member_code_unique unique (member_code),
  constraint members_user_id_unique unique (user_id)
);

create index if not exists members_coach_id_idx on public.members (coach_id);
create index if not exists members_phone_idx on public.members (phone);

-- Ensure optional columns exist for older deployments
alter table public.members add column if not exists nutrition_intervention text;
alter table public.members add column if not exists health_category text;
alter table public.members add column if not exists parq_answers jsonb;
alter table public.members add column if not exists lifestyle_answers jsonb;
alter table public.members add column if not exists exercise_history_answers jsonb;
alter table public.members add column if not exists latest_readiness int;
alter table public.members add column if not exists address text;
alter table public.members add column if not exists email text;
alter table public.members add column if not exists emergency_contact_name text;
alter table public.members add column if not exists emergency_contact_number text;
alter table public.members add column if not exists govt_id_type text;
alter table public.members add column if not exists govt_id_number text;
alter table public.members add column if not exists govt_id_file text;

alter table public.members add column if not exists fms_total int;
alter table public.members add column if not exists pain_nprs int;
alter table public.members add column if not exists vo2_estimate numeric;
alter table public.members add column if not exists movement_quality text;
alter table public.members add column if not exists training_history text;
alter table public.members add column if not exists assessment_lab jsonb;
alter table public.members add column if not exists plans jsonb;
alter table public.members add column if not exists current_plan_id text;

alter table public.members alter column nutrition_intervention set default 'No';
alter table public.members alter column health_category set default 'HEALTHY';
alter table public.members alter column parq_answers set default '{}'::jsonb;
alter table public.members alter column lifestyle_answers set default '{}'::jsonb;
alter table public.members alter column exercise_history_answers set default '{}'::jsonb;
alter table public.members alter column assessment_lab set default '{}'::jsonb;
alter table public.members alter column plans set default '[]'::jsonb;

-- 4) Readiness logs (member + coach)
create table if not exists public.readiness_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  coach_id uuid not null,
  user_id uuid,
  log_date date not null,
  score int,
  data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists readiness_logs_member_id_idx on public.readiness_logs (member_id);
create index if not exists readiness_logs_log_date_idx on public.readiness_logs (log_date);

create or replace function public.set_log_owner()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  new.coach_id := (select coach_id from public.members where id = new.member_id);
  return new;
end;
$$;

drop trigger if exists set_readiness_log_owner on public.readiness_logs;
create trigger set_readiness_log_owner
before insert on public.readiness_logs
for each row
execute function public.set_log_owner();

alter table public.readiness_logs enable row level security;

drop policy if exists "coach_select_readiness_logs" on public.readiness_logs;
create policy "coach_select_readiness_logs"
  on public.readiness_logs
  for select
  to authenticated
  using (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  );

drop policy if exists "member_select_readiness_logs" on public.readiness_logs;
create policy "member_select_readiness_logs"
  on public.readiness_logs
  for select
  to authenticated
  using (
    public.is_member()
    and exists (
      select 1 from public.members m
      where m.id = member_id
        and m.member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
        and public.normalize_person_name(m.full_name) = public.normalize_person_name(
          coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
        )
    )
  );

drop policy if exists "coach_insert_readiness_logs" on public.readiness_logs;
create policy "coach_insert_readiness_logs"
  on public.readiness_logs
  for insert
  to authenticated
  with check (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  );

drop policy if exists "member_insert_readiness_logs" on public.readiness_logs;
create policy "member_insert_readiness_logs"
  on public.readiness_logs
  for insert
  to authenticated
  with check (
    public.is_member()
    and exists (
      select 1 from public.members m
      where m.id = member_id
        and m.member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
        and public.normalize_person_name(m.full_name) = public.normalize_person_name(
          coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
        )
    )
  );

-- 5) Workout logs (member + coach)
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  coach_id uuid not null,
  user_id uuid,
  performed_at date not null,
  rows jsonb default '[]'::jsonb,
  total_volume numeric,
  created_at timestamptz not null default now()
);

create index if not exists workout_logs_member_id_idx on public.workout_logs (member_id);
create index if not exists workout_logs_performed_at_idx on public.workout_logs (performed_at);

drop trigger if exists set_workout_log_owner on public.workout_logs;
create trigger set_workout_log_owner
before insert on public.workout_logs
for each row
execute function public.set_log_owner();

alter table public.workout_logs enable row level security;

drop policy if exists "coach_select_workout_logs" on public.workout_logs;
create policy "coach_select_workout_logs"
  on public.workout_logs
  for select
  to authenticated
  using (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  );

drop policy if exists "member_select_workout_logs" on public.workout_logs;
create policy "member_select_workout_logs"
  on public.workout_logs
  for select
  to authenticated
  using (
    public.is_member()
    and exists (
      select 1 from public.members m
      where m.id = member_id
        and m.member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
        and public.normalize_person_name(m.full_name) = public.normalize_person_name(
          coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
        )
    )
  );

drop policy if exists "coach_insert_workout_logs" on public.workout_logs;
create policy "coach_insert_workout_logs"
  on public.workout_logs
  for insert
  to authenticated
  with check (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  );

drop policy if exists "member_insert_workout_logs" on public.workout_logs;
create policy "member_insert_workout_logs"
  on public.workout_logs
  for insert
  to authenticated
  with check (
    public.is_member()
    and exists (
      select 1 from public.members m
      where m.id = member_id
        and m.member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
        and public.normalize_person_name(m.full_name) = public.normalize_person_name(
          coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
        )
    )
  );

-- 6) Coach session planning
create table if not exists public.session_plans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  coach_id uuid not null,
  user_id uuid,
  plan_date date not null,
  intensity text,
  focus text,
  rpe_target text,
  created_at timestamptz not null default now()
);

create index if not exists session_plans_member_id_idx on public.session_plans (member_id);
create index if not exists session_plans_plan_date_idx on public.session_plans (plan_date);

-- Ensure user_id exists for older deployments and populate owner fields on insert
alter table public.session_plans add column if not exists user_id uuid;

drop trigger if exists set_session_plan_owner on public.session_plans;
create trigger set_session_plan_owner
before insert on public.session_plans
for each row
execute function public.set_log_owner();

alter table public.session_plans enable row level security;

drop policy if exists "coach_manage_session_plans" on public.session_plans;
create policy "coach_manage_session_plans"
  on public.session_plans
  for all
  to authenticated
  using (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  )
  with check (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  );

drop policy if exists "member_select_session_plans" on public.session_plans;
create policy "member_select_session_plans"
  on public.session_plans
  for select
  to authenticated
  using (
    public.is_member()
    and exists (
      select 1 from public.members m
      where m.id = member_id
        and m.member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
        and public.normalize_person_name(m.full_name) = public.normalize_person_name(
          coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
        )
    )
  );

-- 7) Storage buckets + policies (plans + docs)
insert into storage.buckets (id, name, public)
values ('member-plans', 'member-plans', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('member-docs', 'member-docs', false)
on conflict (id) do nothing;

-- Plans bucket access
drop policy if exists "coach_read_member_plans" on storage.objects;
create policy "coach_read_member_plans"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'member-plans'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "member_read_own_plans" on storage.objects;
create policy "member_read_own_plans"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'member-plans'
    and public.is_member()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
        and m.member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
        and public.normalize_person_name(m.full_name) = public.normalize_person_name(
          coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
        )
    )
  );

drop policy if exists "coach_write_member_plans" on storage.objects;
create policy "coach_write_member_plans"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-plans'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "coach_update_member_plans" on storage.objects;
create policy "coach_update_member_plans"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-plans'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  )
  with check (
    bucket_id = 'member-plans'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "coach_delete_member_plans" on storage.objects;
create policy "coach_delete_member_plans"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-plans'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

-- Docs bucket access (coach only read/write; members can read their own docs if needed later)
drop policy if exists "coach_read_member_docs" on storage.objects;
create policy "coach_read_member_docs"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'member-docs'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "coach_write_member_docs" on storage.objects;
create policy "coach_write_member_docs"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-docs'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "coach_update_member_docs" on storage.objects;
create policy "coach_update_member_docs"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-docs'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  )
  with check (
    bucket_id = 'member-docs'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "coach_delete_member_docs" on storage.objects;
create policy "coach_delete_member_docs"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-docs'
    and public.is_coach()
    and (storage.foldername(name))[1] = 'members'
    and exists (
      select 1 from public.members m
      where m.id::text = (storage.foldername(name))[2]
    )
  );

-- keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row
execute function public.set_updated_at();

-- 2) RLS
alter table public.members enable row level security;

-- Helper: role check via user_metadata.role set during signup/login
create or replace function public.is_coach()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') <> '';
$$;

create or replace function public.is_member()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = '';
$$;

-- Normalize names for comparisons (trim + collapse whitespace + lowercase)
create or replace function public.normalize_person_name(p text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(p, '')), E'\\s+', ' ', 'g'));
$$;

-- Coaches can collaborate on a shared roster (all coaches can see/manage all members).

drop policy if exists "coach_select_members" on public.members;
create policy "coach_select_members"
  on public.members
  for select
  to authenticated
  using (public.is_coach());

drop policy if exists "coach_insert_members" on public.members;
create policy "coach_insert_members"
  on public.members
  for insert
  to authenticated
  with check (public.is_coach() and coach_id = auth.uid());

drop policy if exists "coach_update_members" on public.members;
create policy "coach_update_members"
  on public.members
  for update
  to authenticated
  using (public.is_coach())
  with check (public.is_coach());

drop policy if exists "coach_delete_members" on public.members;
create policy "coach_delete_members"
  on public.members
  for delete
  to authenticated
  using (public.is_coach());

-- Members can see/update only their own linked row

drop policy if exists "member_select_own" on public.members;
create policy "member_select_own"
  on public.members
  for select
  to authenticated
  using (
    public.is_member()
    and member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
    and public.normalize_person_name(full_name) = public.normalize_person_name(
      coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
    )
  );

drop policy if exists "member_update_own" on public.members;
create policy "member_update_own"
  on public.members
  for update
  to authenticated
  using (
    public.is_member()
    and member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
    and public.normalize_person_name(full_name) = public.normalize_person_name(
      coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
    )
  )
  with check (
    public.is_member()
    and member_code = coalesce(auth.jwt() -> 'user_metadata' ->> 'member_code', '')
    and public.normalize_person_name(full_name) = public.normalize_person_name(
      coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
    )
  );

-- 3) Secure claim RPC: link an authenticated phone user to their member record.
-- Requires member_code + phone match, and user_id is currently NULL.
-- Note: JWT for phone auth includes a top-level "phone" claim in most Supabase setups.
-- If your project JWT does not include it, we can adjust to use user_metadata.
create or replace function public.claim_member(p_member_code text)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_row public.members;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_phone := coalesce(auth.jwt() ->> 'phone', auth.jwt() -> 'user_metadata' ->> 'phone');
  if v_phone is null or length(trim(v_phone)) = 0 then
    raise exception 'Phone claim missing from JWT';
  end if;

  update public.members
    set user_id = auth.uid()
  where member_code = p_member_code
    and phone = v_phone
    and user_id is null
  returning * into v_row;

  if not found then
    raise exception 'Invalid member_id/phone, or already claimed';
  end if;

  return v_row;
end;
$$;

revoke all on function public.claim_member(text) from public;
grant execute on function public.claim_member(text) to authenticated;

-- 8) Coach-only report exports (audit log)
create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  created_at timestamptz not null default now(),
  format text not null,
  payload jsonb not null default '{}'::jsonb
);

alter table public.report_exports enable row level security;

drop policy if exists "coach_manage_report_exports" on public.report_exports;
create policy "coach_manage_report_exports"
  on public.report_exports
  for all
  to authenticated
  using (public.is_coach() and coach_id = auth.uid())
  with check (public.is_coach() and coach_id = auth.uid());

-- 9) Coach-only report send intents (audit log)
create table if not exists public.report_sends (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  created_at timestamptz not null default now(),
  channel text not null,
  recipient text,
  payload jsonb not null default '{}'::jsonb
);

alter table public.report_sends enable row level security;

drop policy if exists "coach_manage_report_sends" on public.report_sends;
create policy "coach_manage_report_sends"
  on public.report_sends
  for all
  to authenticated
  using (public.is_coach() and coach_id = auth.uid())
  with check (public.is_coach() and coach_id = auth.uid());

-- 10) Billing updates (coach-only, per member)
create table if not exists public.billing_updates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  coach_id uuid not null,
  user_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_updates_member_id_idx on public.billing_updates (member_id);

drop trigger if exists set_billing_update_owner on public.billing_updates;
create trigger set_billing_update_owner
before insert on public.billing_updates
for each row
execute function public.set_log_owner();

alter table public.billing_updates enable row level security;

drop policy if exists "coach_select_billing_updates" on public.billing_updates;
create policy "coach_select_billing_updates"
  on public.billing_updates
  for select
  to authenticated
  using (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  );

drop policy if exists "coach_insert_billing_updates" on public.billing_updates;
create policy "coach_insert_billing_updates"
  on public.billing_updates
  for insert
  to authenticated
  with check (
    public.is_coach()
    and exists (
      select 1 from public.members m
      where m.id = member_id
    )
  );
