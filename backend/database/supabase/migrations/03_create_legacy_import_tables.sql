-- Exact raw import tables matching the existing Supabase CSV exports.
-- All source columns are text to avoid losing or coercing legacy values during import.

begin;

create table if not exists legacy.universities_raw (
  id text primary key,
  name text,
  slug text,
  abbreviation text,
  type text,
  city text,
  province text,
  country text,
  campuses text,
  website text,
  application_portal text,
  contacts text,
  application_fee text,
  intakes text,
  deadlines text,
  eligibility text,
  scholarships text,
  internships text,
  campus_life text,
  security text,
  top_ug_programs text,
  top_pg_programs text
);

create table if not exists legacy.programmes_raw (
  id text primary key,
  institution_id text,
  institution_name text,
  level text,
  name text,
  faculty text,
  duration_years text,
  annual_fee_cad text,
  total_fee_cad text,
  min_class12_percent text,
  required_subjects text,
  entry_roles text,
  features text
);

create table if not exists legacy.accommodations_raw (
  id text primary key,
  name text,
  slug text,
  type text,
  gender_policy text,
  city text,
  province text,
  country text,
  address text,
  price_per_month_cad text,
  room_types text,
  amenities text,
  rules text,
  rating text,
  reviews_count text,
  description text,
  images text,
  nearby_universities text,
  contact_email text
);

create table if not exists legacy.users_raw (
  id text primary key,
  full_name text,
  email text,
  password text,
  phone text,
  preferred_country text,
  is_admin text,
  recently_viewed text,
  created_at text
);

create table if not exists legacy.favorites_raw (
  id text primary key,
  user_id text,
  institution_id text,
  institution_name text,
  city text,
  province text,
  country text,
  created_at text
);

create table if not exists legacy.search_history_raw (
  id text primary key,
  user_id text,
  query text,
  filters text,
  created_at text
);

create table if not exists legacy.contact_messages_raw (
  id text primary key,
  name text,
  email text,
  subject text,
  message text,
  created_at text
);

revoke all on all tables in schema legacy from public, anon, authenticated;
grant all privileges on all tables in schema legacy to postgres, service_role;

commit;
