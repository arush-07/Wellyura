-- 08_workspace_features.sql
-- User deadlines, alert preferences, automatic signup records and RLS.
-- Safe to run more than once.

begin;

-- =========================================================
-- 1. USER DEADLINES
-- =========================================================

create table if not exists public.user_deadlines (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  title text not null
    check (char_length(btrim(title)) between 1 and 200),

  due_date date not null,

  notes text,

  is_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add columns when upgrading an older version of the table.
alter table public.user_deadlines
  add column if not exists notes text;

alter table public.user_deadlines
  add column if not exists is_completed boolean not null default false;

alter table public.user_deadlines
  add column if not exists created_at timestamptz not null default now();

alter table public.user_deadlines
  add column if not exists updated_at timestamptz not null default now();

create index if not exists user_deadlines_user_due_idx
on public.user_deadlines(user_id, due_date);

create index if not exists user_deadlines_active_idx
on public.user_deadlines(user_id, is_completed, due_date);

alter table public.user_deadlines
enable row level security;

grant select, insert, update, delete
on public.user_deadlines
to authenticated;

grant all privileges
on public.user_deadlines
to service_role;

drop policy if exists user_deadlines_select_own
on public.user_deadlines;

drop policy if exists user_deadlines_insert_own
on public.user_deadlines;

drop policy if exists user_deadlines_update_own
on public.user_deadlines;

drop policy if exists user_deadlines_delete_own
on public.user_deadlines;

create policy user_deadlines_select_own
on public.user_deadlines
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy user_deadlines_insert_own
on public.user_deadlines
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy user_deadlines_update_own
on public.user_deadlines
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy user_deadlines_delete_own
on public.user_deadlines
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);


-- =========================================================
-- 2. USER ALERT PREFERENCES
-- =========================================================

create table if not exists public.user_alert_preferences (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  deadline_reminders boolean not null default true,
  scholarship_updates boolean not null default true,
  programme_updates boolean not null default false,
 scholarship_updates boolean not null default true,
  programme_updates boolean not null default false,
  email_notifications boolean not null default true,

  deadline_reminder_days integer not null default 7,

  timezone text not null default 'Asia/Kolkata',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade older versions of the table.
alter table public.user_alert_preferences
  add column if not exists deadline_reminders
  boolean not null default true;

alter table public.user_alert_preferences
  add column if not exists scholarship_updates
  boolean not null default true;

alter table public.user_alert_preferences
  add column if not exists programme_updates
  boolean not null default false;

alter table public.user_alert_preferences
  add column if not exists email_notifications
  boolean not null default true;

alter table public.user_alert_preferences
  add column if not exists deadline_reminder_days
  integer not null default 7;

alter table public.user_alert_preferences
  add column if not exists timezone
  text not null default 'Asia/Kolkata';

alter table public.user_alert_preferences
  add column if not exists created_at
  timestamptz not null default now();

alter table public.user_alert_preferences
  add column if not exists updated_at
  timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid =
      'public.user_alert_preferences'::regclass
      and conname =
        'user_alert_preferences_reminder_days_check'
  ) then
    alter table public.user_alert_preferences
      add constraint
        user_alert_preferences_reminder_days_check
      check (
        deadline_reminder_days between 1 and 60
      );
  end if;
end
$$;

alter table public.user_alert_preferences
enable row level security;

grant select, insert, update, delete
on public.user_alert_preferences
to authenticated;

grant all privileges
on public.user_alert_preferences
to service_role;

drop policy if exists user_alert_preferences_select_own
on public.user_alert_preferences;

drop policy if exists user_alert_preferences_insert_own
on public.user_alert_preferences;

drop policy if exists user_alert_preferences_update_own
on public.user_alert_preferences;

drop policy if exists user_alert_preferences_delete_own
on public.user_alert_preferences;

create policy user_alert_preferences_select_own
on public.user_alert_preferences
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy user_alert_preferences_insert_own
on public.user_alert_preferences
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy user_alert_preferences_update_own
on public.user_alert_preferences
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

create policy user_alert_preferences_delete_own
on public.user_alert_preferences
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);


-- =========================================================
-- 3. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists
  set_user_deadlines_updated_at
on public.user_deadlines;

create trigger set_user_deadlines_updated_at
before update
on public.user_deadlines
for each row
execute function public.set_updated_at();


drop trigger if exists
  set_user_alert_preferences_updated_at
on public.user_alert_preferences;

create trigger set_user_alert_preferences_updated_at
before update
on public.user_alert_preferences
for each row
execute function public.set_updated_at();


-- =========================================================
-- 4. CREATE PREFERENCES FOR EXISTING USERS
-- =========================================================

insert into public.user_alert_preferences (
  user_id
)
select id
from auth.users
on conflict (user_id) do nothing;


-- =========================================================
-- 5. AUTOMATIC RECORDS FOR FUTURE SIGNUPS
-- =========================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name
  )
  values (
    new.id,
    coalesce(
      nullif(
        btrim(
          new.raw_user_meta_data->>'full_name'
        ),
        ''
      ),
      nullif(
        btrim(
          new.raw_user_meta_data->>'name'
        ),
        ''
      )
    )
  )
  on conflict (id) do update
  set full_name = coalesce(
    public.profiles.full_name,
    excluded.full_name
  );

  insert into public.user_roles (
    user_id,
    role
  )
  values (
    new.id,
    'student'::public.user_role
  )
  on conflict (user_id, role) do nothing;

  insert into public.user_alert_preferences (
    user_id
  )
  values (
    new.id
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all
on function public.handle_new_auth_user()
from public;

grant execute
on function public.handle_new_auth_user()
to service_role;

drop trigger if exists
  on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_new_auth_user();

commit;


-- =========================================================
-- 6. VERIFICATION
-- =========================================================

select
  to_regclass(
    'public.user_deadlines'
  ) as deadlines_table,

  to_regclass(
    'public.user_alert_preferences'
  ) as alert_preferences_table,

  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_alert_preferences'
      and column_name = 'deadline_reminder_days'
  ) as reminder_days_created,

  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_alert_preferences'
      and column_name = 'timezone'
  ) as timezone_created,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.user_deadlines'::regclass
  ) as deadlines_rls_enabled,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.user_alert_preferences'::regclass
  ) as alerts_rls_enabled,

  exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and not tgisinternal
  ) as signup_trigger_created;