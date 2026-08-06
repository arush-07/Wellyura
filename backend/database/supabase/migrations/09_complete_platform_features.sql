-- 09_complete_platform_features.sql
-- Persistent saved universities and university comparisons.
-- Supports university lookup by legacy_id, slug, or UUID.
-- Safe to run more than once.

begin;

-- =========================================================
-- 1. UNIVERSITY COMPARISON ITEMS
-- =========================================================

create table if not exists public.university_comparison_items (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  university_id uuid not null
    references public.universities(id)
    on delete cascade,

  position smallint not null
    check (position between 1 and 4),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, university_id),
  unique (user_id, position)
);

alter table public.university_comparison_items
  add column if not exists notes text;

alter table public.university_comparison_items
  add column if not exists created_at
  timestamptz not null default now();

alter table public.university_comparison_items
  add column if not exists updated_at
  timestamptz not null default now();


-- =========================================================
-- 2. INDEXES
-- =========================================================

create index if not exists
university_comparison_items_user_position_idx
on public.university_comparison_items (
  user_id,
  position
);

create index if not exists
university_comparison_items_university_idx
on public.university_comparison_items (
  university_id
);

create index if not exists
university_favorites_user_created_idx
on public.university_favorites (
  user_id,
  created_at
);


-- =========================================================
-- 3. ROW LEVEL SECURITY
-- =========================================================

alter table public.university_comparison_items
enable row level security;

grant select, insert, update, delete
on public.university_comparison_items
to authenticated;

grant all privileges
on public.university_comparison_items
to service_role;

drop policy if exists comparison_items_own
on public.university_comparison_items;

create policy comparison_items_own
on public.university_comparison_items
for all
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);


-- =========================================================
-- 4. UPDATED_AT TRIGGER
-- =========================================================

drop trigger if exists
set_university_comparison_items_updated_at
on public.university_comparison_items;

create trigger
set_university_comparison_items_updated_at
before update
on public.university_comparison_items
for each row
execute function public.set_updated_at();


-- =========================================================
-- 5. RESOLVE UNIVERSITY KEY
-- =========================================================
-- Accepts:
--   1. universities.legacy_id
--   2. universities.slug
--   3. universities.id as UUID text

create or replace function public.resolve_university_key(
  p_key text
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select universities.id
  from public.universities universities
  where universities.slug =
          nullif(btrim(p_key), '')
     or universities.legacy_id =
          nullif(btrim(p_key), '')
     or universities.id::text =
          nullif(btrim(p_key), '')
  order by
    case
      when universities.slug =
        nullif(btrim(p_key), '')
      then 1

      when universities.legacy_id =
        nullif(btrim(p_key), '')
      then 2

      else 3
    end
  limit 1;
$$;


-- =========================================================
-- 6. REPLACE COMPLETE COMPARISON LIST
-- =========================================================
-- Replaces the signed-in user's entire comparison selection.
-- Accepts up to four legacy IDs, slugs, or UUID strings.

create or replace function public.replace_my_comparisons(
  legacy_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.university_comparison_items
  where user_id = current_user_id;

  with supplied as (
    select
      btrim(value) as university_key,
      min(ordinality) as first_position
    from unnest(
      coalesce(
        legacy_ids,
        '{}'::text[]
      )
    ) with ordinality as supplied_values(
      value,
      ordinality
    )
    where nullif(btrim(value), '') is not null
    group by btrim(value)
  ),

  resolved as (
    select
      public.resolve_university_key(
        supplied.university_key
      ) as university_id,

      supplied.first_position

    from supplied
  ),

  valid_resolved as (
    select
      university_id,
      min(first_position) as first_position
    from resolved
    where university_id is not null
    group by university_id
    order by min(first_position)
    limit 4
  ),

  numbered as (
    select
      university_id,

      row_number() over (
        order by first_position
      )::smallint as position

    from valid_resolved
  )

  insert into public.university_comparison_items (
    user_id,
    university_id,
    position
  )
  select
    current_user_id,
    numbered.university_id,
    numbered.position
  from numbered;
end;
$$;


-- =========================================================
-- 7. TOGGLE SAVED UNIVERSITY
-- =========================================================
-- Returns true when the university is saved.
-- Returns false when it is removed.

create or replace function public.toggle_university_favorite(
  p_legacy_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_university_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(btrim(p_legacy_id), '') is null then
    raise exception
      'University identifier is required';
  end if;

  target_university_id :=
    public.resolve_university_key(
      p_legacy_id
    );

  if target_university_id is null then
    raise exception
      'University not found for key: %',
      p_legacy_id;
  end if;

  if exists (
    select 1
    from public.university_favorites favorites
    where favorites.user_id =
            current_user_id
      and favorites.university_id =
            target_university_id
  ) then

    delete from public.university_favorites
    where user_id = current_user_id
      and university_id =
            target_university_id;

    return false;
  end if;

  insert into public.university_favorites (
    user_id,
    university_id
  )
  values (
    current_user_id,
    target_university_id
  )
  on conflict (
    user_id,
    university_id
  ) do nothing;

  return true;
end;
$$;


-- =========================================================
-- 8. TOGGLE UNIVERSITY COMPARISON
-- =========================================================
-- Returns true when added.
-- Returns false when removed.
-- Maximum comparison size: four universities.

create or replace function public.toggle_university_comparison(
  p_legacy_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_university_id uuid;
  current_count integer;
  available_position smallint;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(btrim(p_legacy_id), '') is null then
    raise exception
      'University identifier is required';
  end if;

  target_university_id :=
    public.resolve_university_key(
      p_legacy_id
    );

  if target_university_id is null then
    raise exception
      'University not found for key: %',
      p_legacy_id;
  end if;

  if exists (
    select 1
    from public.university_comparison_items items
    where items.user_id =
            current_user_id
      and items.university_id =
            target_university_id
  ) then

    delete from public.university_comparison_items
    where user_id = current_user_id
      and university_id =
            target_university_id;

    return false;
  end if;

  select count(*)
  into current_count
  from public.university_comparison_items
  where user_id = current_user_id;

  if current_count >= 4 then
    raise exception
      'You can compare up to four universities';
  end if;

  select candidate::smallint
  into available_position
  from generate_series(1, 4) candidate
  where not exists (
    select 1
    from public.university_comparison_items items
    where items.user_id =
            current_user_id
      and items.position =
            candidate
  )
  order by candidate
  limit 1;

  if available_position is null then
    raise exception
      'No comparison position is available';
  end if;

  insert into public.university_comparison_items (
    user_id,
    university_id,
    position
  )
  values (
    current_user_id,
    target_university_id,
    available_position
  );

  return true;
end;
$$;


-- =========================================================
-- 9. CLEAR COMPARISON LIST
-- =========================================================

create or replace function public.clear_university_comparison()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.university_comparison_items
  where user_id = current_user_id;
end;
$$;


-- =========================================================
-- 10. FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.resolve_university_key(text)
from public, anon;

revoke all
on function public.replace_my_comparisons(text[])
from public, anon;

revoke all
on function public.toggle_university_favorite(text)
from public, anon;

revoke all
on function public.toggle_university_comparison(text)
from public, anon;

revoke all
on function public.clear_university_comparison()
from public, anon;


grant execute
on function public.resolve_university_key(text)
to authenticated, service_role;

grant execute
on function public.replace_my_comparisons(text[])
to authenticated, service_role;

grant execute
on function public.toggle_university_favorite(text)
to authenticated, service_role;

grant execute
on function public.toggle_university_comparison(text)
to authenticated, service_role;

grant execute
on function public.clear_university_comparison()
to authenticated, service_role;

commit;


-- =========================================================
-- 11. VERIFICATION
-- =========================================================

select
  to_regclass(
    'public.university_comparison_items'
  ) as comparison_table,

  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename =
        'university_comparison_items'
      and policyname =
        'comparison_items_own'
  ) as comparison_rls_policy_created,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.university_comparison_items'::regclass
  ) as comparison_rls_enabled,

  to_regprocedure(
    'public.resolve_university_key(text)'
  ) as university_resolver_function,

  to_regprocedure(
    'public.replace_my_comparisons(text[])'
  ) as replace_comparisons_function,

  to_regprocedure(
    'public.toggle_university_favorite(text)'
  ) as favorite_toggle_function,

  to_regprocedure(
    'public.toggle_university_comparison(text)'
  ) as comparison_toggle_function,

  to_regprocedure(
    'public.clear_university_comparison()'
  ) as clear_comparison_function;