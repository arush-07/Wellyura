-- 12_search_history_features.sql
-- Persistent user search history and helper functions.
-- Safe to run more than once.

begin;

-- =========================================================
-- 1. SEARCH HISTORY TABLE UPGRADES
-- =========================================================

alter table public.search_history
  add column if not exists query text;

alter table public.search_history
  add column if not exists filters jsonb
  not null default '{}'::jsonb;

alter table public.search_history
  add column if not exists created_at timestamptz
  not null default now();

create index if not exists
search_history_user_created_idx
on public.search_history (
  user_id,
  created_at desc
);

create index if not exists
search_history_filters_gin_idx
on public.search_history
using gin (filters);


-- =========================================================
-- 2. ROW LEVEL SECURITY
-- =========================================================

alter table public.search_history
enable row level security;

grant select, insert, delete
on public.search_history
to authenticated;

grant all privileges
on public.search_history
to service_role;

drop policy if exists search_history_own
on public.search_history;

create policy search_history_own
on public.search_history
for all
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);


-- =========================================================
-- 3. RECORD A SEARCH
-- =========================================================
-- Avoids inserting the same search repeatedly within
-- a five-minute period.

create or replace function public.record_search_history(
  p_query text default null,
  p_filters jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  clean_query text;
  clean_filters jsonb;
  existing_search_id uuid;
  new_search_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  clean_query :=
    nullif(btrim(coalesce(p_query, '')), '');

  clean_filters :=
    coalesce(p_filters, '{}'::jsonb);

  -- Do not save a completely empty search.
  if clean_query is null
     and clean_filters = '{}'::jsonb
  then
    return null;
  end if;

  select history.id
  into existing_search_id
  from public.search_history history
  where history.user_id = current_user_id
    and history.query is not distinct from clean_query
    and history.filters = clean_filters
    and history.created_at >= now() - interval '5 minutes'
  order by history.created_at desc
  limit 1;

  if existing_search_id is not null then
    return existing_search_id;
  end if;

  insert into public.search_history (
    user_id,
    query,
    filters
  )
  values (
    current_user_id,
    clean_query,
    clean_filters
  )
  returning id into new_search_id;

  return new_search_id;
end;
$$;


-- =========================================================
-- 4. DELETE ONE SEARCH
-- =========================================================

create or replace function public.delete_my_search_history(
  p_search_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  deleted_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.search_history
  where id = p_search_id
    and user_id = current_user_id;

  get diagnostics deleted_count = row_count;

  return deleted_count > 0;
end;
$$;


-- =========================================================
-- 5. CLEAR ALL SEARCHES
-- =========================================================

create or replace function public.clear_my_search_history()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  deleted_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.search_history
  where user_id = current_user_id;

  get diagnostics deleted_count = row_count;

  return deleted_count;
end;
$$;


-- =========================================================
-- 6. FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.record_search_history(text, jsonb)
from public, anon;

revoke all
on function public.delete_my_search_history(uuid)
from public, anon;

revoke all
on function public.clear_my_search_history()
from public, anon;

grant execute
on function public.record_search_history(text, jsonb)
to authenticated, service_role;

grant execute
on function public.delete_my_search_history(uuid)
to authenticated, service_role;

grant execute
on function public.clear_my_search_history()
to authenticated, service_role;

commit;


-- =========================================================
-- 7. VERIFICATION
-- =========================================================

select
  to_regclass(
    'public.search_history'
  ) as search_history_table,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.search_history'::regclass
  ) as search_history_rls_enabled,

  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'search_history'
      and policyname = 'search_history_own'
  ) as search_history_policy_created,

  to_regprocedure(
    'public.record_search_history(text,jsonb)'
  ) as record_search_function,

  to_regprocedure(
    'public.delete_my_search_history(uuid)'
  ) as delete_search_function,

  to_regprocedure(
    'public.clear_my_search_history()'
  ) as clear_search_function;