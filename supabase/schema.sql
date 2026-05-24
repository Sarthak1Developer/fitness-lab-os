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
  readiness_trend text,
  phase text default 'UNCLASSIFIED',
  status text default 'Active',
  renewal date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint members_member_code_unique unique (member_code),
  constraint members_user_id_unique unique (user_id)
);

create index if not exists members_coach_id_idx on public.members (coach_id);
create index if not exists members_phone_idx on public.members (phone);

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

-- Coaches can manage only their members (coach_id = auth.uid())

drop policy if exists "coach_select_members" on public.members;
create policy "coach_select_members"
  on public.members
  for select
  to authenticated
  using (public.is_coach() and coach_id = auth.uid());

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
  using (public.is_coach() and coach_id = auth.uid())
  with check (public.is_coach() and coach_id = auth.uid());

drop policy if exists "coach_delete_members" on public.members;
create policy "coach_delete_members"
  on public.members
  for delete
  to authenticated
  using (public.is_coach() and coach_id = auth.uid());

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
