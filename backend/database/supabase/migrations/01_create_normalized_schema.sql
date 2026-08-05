-- Wellyura clean normalized schema
-- New Supabase project only. Non-destructive: no DROP TABLE statements.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Abort if this is accidentally run against the old Wellyura project.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name in ('programs','users','favorites')
  ) then
    raise exception 'Old Wellyura tables detected. Run this migration only in the new Supabase project.';
  end if;
end $$;

create schema if not exists legacy;
create schema if not exists internal;

revoke all on schema legacy from public, anon, authenticated;
revoke all on schema internal from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='publication_status') then
    create type public.publication_status as enum ('draft','review','published','archived');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='verification_status') then
    create type public.verification_status as enum ('unverified','legacy_import','source_checked','verified','disputed');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='user_role') then
    create type public.user_role as enum ('student','support','editor','publisher','admin');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function internal.slugify(value text)
returns text
language sql
immutable
parallel safe
set search_path = public, internal
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(value,''))), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function internal.safe_jsonb(value text)
returns jsonb
language plpgsql
immutable
set search_path = public, internal
as $$
begin
  if value is null or btrim(value) = '' then return '{}'::jsonb; end if;
  return value::jsonb;
exception when others then
  return jsonb_build_object('_raw', value, '_parse_error', true);
end;
$$;

create or replace function internal.numeric_range(value text)
returns numeric[]
language plpgsql
immutable
set search_path = public, internal
as $$
declare
  cleaned text;
  parts text[];
  first_value numeric;
  second_value numeric;
begin
  if value is null or btrim(value) = '' then return array[null::numeric, null::numeric]; end if;
  cleaned := regexp_replace(lower(value), '[^0-9.\-]+', '', 'g');
  if cleaned = '' then return array[null::numeric, null::numeric]; end if;
  if cleaned ~ '^[0-9]+(\.[0-9]+)?-[0-9]+(\.[0-9]+)?$' then
    parts := string_to_array(cleaned, '-');
    first_value := parts[1]::numeric;
    second_value := parts[2]::numeric;
    return array[least(first_value, second_value), greatest(first_value, second_value)];
  elsif cleaned ~ '^[0-9]+(\.[0-9]+)?$' then
    first_value := cleaned::numeric;
    return array[first_value, first_value];
  end if;
  return array[null::numeric, null::numeric];
exception when others then
  return array[null::numeric, null::numeric];
end;
$$;

-- Locations -----------------------------------------------------------------
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  iso2 char(2) unique,
  iso3 char(3) unique,
  region text,
  currency_code char(3),
  publication_status public.publication_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  province text not null default '',
  slug text not null,
  publication_status public.publication_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_id, name, province),
  unique(country_id, slug, province)
);

-- Universities ---------------------------------------------------------------
create table if not exists public.institution_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  institution_type_id uuid references public.institution_types(id) on delete set null,
  country_id uuid not null references public.countries(id),
  primary_city_id uuid references public.cities(id) on delete set null,
  name text not null,
  slug text not null unique,
  abbreviation text,
  website text,
  application_portal text,
  application_fee numeric(14,2),
  description text,
  publication_status public.publication_status not null default 'published',
  verification_status public.verification_status not null default 'legacy_import',
  last_verified_at timestamptz,
  published_at timestamptz,
  legacy_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  city_id uuid references public.cities(id) on delete set null,
  name text not null,
  slug text not null,
  address text,
  is_primary boolean not null default false,
  legacy_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(university_id, slug)
);

create table if not exists public.university_contacts (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  contact_type text not null,
  email text,
  phone text,
  address text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(university_id, contact_type)
);

create table if not exists public.university_intakes (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(university_id, label)
);

create table if not exists public.university_deadlines (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  label text not null,
  deadline_text text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.university_eligibility (
  university_id uuid primary key references public.universities(id) on delete cascade,
  undergraduate jsonb not null default '{}'::jsonb,
  postgraduate jsonb not null default '{}'::jsonb,
  raw_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.university_scholarships (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  details jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.university_insights (
  university_id uuid primary key references public.universities(id) on delete cascade,
  internships jsonb not null default '{}'::jsonb,
  campus_life jsonb not null default '{}'::jsonb,
  security jsonb not null default '{}'::jsonb,
  top_ug_programs jsonb not null default '[]'::jsonb,
  top_pg_programs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Programmes ----------------------------------------------------------------
create table if not exists public.degree_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  sort_order integer not null default 0
);

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  university_id uuid not null references public.universities(id) on delete cascade,
  degree_level_id uuid references public.degree_levels(id) on delete set null,
  name text not null,
  slug text not null,
  faculty text,
  duration_min_months integer,
  duration_max_months integer,
  duration_text text,
  description text,
  publication_status public.publication_status not null default 'published',
  verification_status public.verification_status not null default 'legacy_import',
  last_verified_at timestamptz,
  legacy_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(university_id, slug),
  check(duration_min_months is null or duration_min_months > 0),
  check(duration_max_months is null or duration_max_months > 0),
  check(duration_min_months is null or duration_max_months is null or duration_min_months <= duration_max_months)
);

create table if not exists public.programme_fees (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  fee_type text not null check(fee_type in ('annual','total')),
  amount_min numeric(14,2),
  amount_max numeric(14,2),
  currency_code char(3) not null default 'CAD',
  period text not null,
  raw_value text,
  verification_status public.verification_status not null default 'legacy_import',
  created_at timestamptz not null default now(),
  unique(programme_id, fee_type),
  check(amount_min is null or amount_min >= 0),
  check(amount_max is null or amount_max >= 0),
  check(amount_min is null or amount_max is null or amount_min <= amount_max)
);

create table if not exists public.programme_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  requirement_type text not null,
  minimum_value numeric,
  maximum_value numeric,
  raw_value text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.programme_required_subjects (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  subject text not null,
  sort_order integer not null default 0,
  unique(programme_id, subject)
);

create table if not exists public.programme_career_roles (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  role_name text not null,
  sort_order integer not null default 0,
  unique(programme_id, role_name)
);

create table if not exists public.programme_features (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  feature text not null,
  sort_order integer not null default 0,
  unique(programme_id, feature)
);

-- Accommodation --------------------------------------------------------------
create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  city_id uuid references public.cities(id) on delete set null,
  name text not null,
  slug text not null unique,
  property_type text,
  gender_policy text,
  address text,
  base_price_monthly numeric(14,2),
  currency_code char(3) not null default 'CAD',
  rating numeric(3,2),
  reviews_count integer not null default 0,
  description text,
  contact_email text,
  rules jsonb not null default '{}'::jsonb,
  publication_status public.publication_status not null default 'published',
  verification_status public.verification_status not null default 'legacy_import',
  legacy_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(base_price_monthly is null or base_price_monthly >= 0),
  check(rating is null or rating between 0 and 5)
);

create table if not exists public.accommodation_room_types (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  name text not null,
  price_per_month numeric(14,2),
  currency_code char(3) not null default 'CAD',
  available_rooms integer,
  amenities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(accommodation_id, name)
);

create table if not exists public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists public.accommodation_amenities (
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key(accommodation_id, amenity_id)
);

create table if not exists public.accommodation_images (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  path text not null,
  alt_text text,
  sort_order integer not null default 0,
  unique(accommodation_id, path)
);

create table if not exists public.accommodation_universities (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  university_id uuid references public.universities(id) on delete set null,
  legacy_institution_id text,
  legacy_institution_name text,
  distance_km numeric(8,2),
  commute_mode text,
  commute_time_mins integer,
  created_at timestamptz not null default now()
);

-- Authentication and user workspace -----------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_id text unique,
  full_name text,
  phone text,
  preferred_country_id uuid references public.countries(id) on delete set null,
  recently_viewed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  granted_at timestamptz not null default now(),
  primary key(user_id, role)
);

create table if not exists public.university_favorites (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, university_id)
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  query text,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.housing_inquiries (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid references auth.users(id) on delete set null,
  accommodation_id uuid references public.accommodations(id) on delete set null,
  room_type text,
  check_in_date date,
  check_out_date date,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.accommodation_reviews (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  user_id uuid references auth.users(id) on delete set null,
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  rating numeric(3,2) not null check(rating between 0 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(user_id, accommodation_id)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text,
  email text,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- Migration auditing ---------------------------------------------------------
create table if not exists internal.import_batches (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  source_project_ref text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  notes text
);

create table if not exists internal.import_issues (
  id bigint generated always as identity primary key,
  batch_id uuid references internal.import_batches(id) on delete cascade,
  entity_type text not null,
  legacy_id text,
  field_name text,
  raw_value text,
  issue text not null,
  created_at timestamptz not null default now()
);

-- Helpful indexes ------------------------------------------------------------
create index if not exists cities_country_idx on public.cities(country_id, name);
create index if not exists universities_country_idx on public.universities(country_id, publication_status);
create index if not exists universities_city_idx on public.universities(primary_city_id);
create index if not exists universities_name_trgm_idx on public.universities using gin(name extensions.gin_trgm_ops);
create index if not exists programmes_university_idx on public.programmes(university_id, publication_status);
create index if not exists programmes_level_idx on public.programmes(degree_level_id);
create index if not exists programmes_name_trgm_idx on public.programmes using gin(name extensions.gin_trgm_ops);
create index if not exists programme_fees_amount_idx on public.programme_fees(amount_min, amount_max);
create index if not exists accommodations_city_idx on public.accommodations(city_id, publication_status);
create index if not exists favorites_user_idx on public.university_favorites(user_id, created_at desc);
create index if not exists search_history_user_idx on public.search_history(user_id, created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);

-- Updated-at triggers --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['countries','cities','universities','campuses','programmes','accommodations','profiles']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', t, t);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict(id) do nothing;

  insert into public.user_roles(user_id, role)
  values(new.id, 'student')
  on conflict(user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

commit;
