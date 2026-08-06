-- 10_admin_notifications_and_reviews.sql
-- Admin management, accommodation review summaries,
-- announcements and notification delivery tracking.
-- Safe to run more than once.

begin;

-- =========================================================
-- 1. HOUSING INQUIRY STATUS VALIDATION
-- =========================================================

update public.housing_inquiries
set status = 'pending'
where status is null
   or status not in (
     'pending',
     'in_progress',
     'resolved',
     'closed'
   );

alter table public.housing_inquiries
  alter column status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid =
      'public.housing_inquiries'::regclass
      and conname =
        'housing_inquiries_status_check'
  ) then
    alter table public.housing_inquiries
      add constraint housing_inquiries_status_check
      check (
        status in (
          'pending',
          'in_progress',
          'resolved',
          'closed'
        )
      );
  end if;
end
$$;


-- =========================================================
-- 2. ACCOMMODATION REVIEW TIMESTAMPS
-- =========================================================

alter table public.accommodation_reviews
  add column if not exists updated_at
  timestamptz not null default now();

drop trigger if exists
  set_accommodation_reviews_updated_at
on public.accommodation_reviews;

create trigger set_accommodation_reviews_updated_at
before update
on public.accommodation_reviews
for each row
execute function public.set_updated_at();


-- =========================================================
-- 3. AUTOMATIC ACCOMMODATION RATING SUMMARY
-- =========================================================

create or replace function
public.refresh_accommodation_review_summary(
  target_accommodation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_accommodation_id is null then
    return;
  end if;

  update public.accommodations
  set
    rating = (
      select round(avg(rating)::numeric, 2)
      from public.accommodation_reviews
      where accommodation_id =
        target_accommodation_id
    ),
    reviews_count = (
      select count(*)::integer
      from public.accommodation_reviews
      where accommodation_id =
        target_accommodation_id
    ),
    updated_at = now()
  where id = target_accommodation_id;
end;
$$;

revoke all
on function
public.refresh_accommodation_review_summary(uuid)
from public, anon, authenticated;

grant execute
on function
public.refresh_accommodation_review_summary(uuid)
to service_role;


create or replace function
public.handle_accommodation_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_accommodation_review_summary(
      old.accommodation_id
    );

    return old;
  end if;

  perform public.refresh_accommodation_review_summary(
    new.accommodation_id
  );

  if tg_op = 'UPDATE'
     and old.accommodation_id
       is distinct from new.accommodation_id
  then
    perform public.refresh_accommodation_review_summary(
      old.accommodation_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists
  accommodation_review_summary_trigger
on public.accommodation_reviews;

create trigger accommodation_review_summary_trigger
after insert or update or delete
on public.accommodation_reviews
for each row
execute function
public.handle_accommodation_review_change();


-- Refresh existing accommodation totals.
do $$
declare
  accommodation_record record;
begin
  for accommodation_record in
    select id
    from public.accommodations
  loop
    perform public.refresh_accommodation_review_summary(
      accommodation_record.id
    );
  end loop;
end
$$;


-- =========================================================
-- 4. PUBLIC REVIEW VIEW WITH AUTHOR NAME
-- =========================================================

create or replace view
public.accommodation_reviews_public
with (security_invoker = true)
as
select
  reviews.id,
  reviews.accommodation_id,
  reviews.rating,
  reviews.comment,
  reviews.created_at,
  reviews.updated_at,
  coalesce(
    nullif(btrim(profiles.full_name), ''),
    'Wellyura student'
  ) as author_name
from public.accommodation_reviews reviews
left join public.profiles profiles
  on profiles.id = reviews.user_id;

grant select
on public.accommodation_reviews_public
to anon, authenticated, service_role;


-- =========================================================
-- 5. PLATFORM ANNOUNCEMENTS
-- =========================================================

create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),

  announcement_type text not null
    default 'general',

  title text not null
    check (
      char_length(btrim(title))
      between 1 and 200
    ),

  message text not null
    check (
      char_length(btrim(message))
      between 1 and 5000
    ),

  link_url text,

  target_country_id uuid
    references public.countries(id)
    on delete set null,

  target_university_id uuid
    references public.universities(id)
    on delete set null,

  target_programme_id uuid
    references public.programmes(id)
    on delete set null,

  is_published boolean not null default false,

  publish_at timestamptz,
  expires_at timestamptz,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    announcement_type in (
      'general',
      'scholarship',
      'programme',
      'university',
      'accommodation',
      'system'
    )
  ),

  check (
    expires_at is null
    or publish_at is null
    or expires_at > publish_at
  )
);

create index if not exists
platform_announcements_publication_idx
on public.platform_announcements(
  is_published,
  publish_at,
  expires_at
);

create index if not exists
platform_announcements_type_idx
on public.platform_announcements(
  announcement_type
);

alter table public.platform_announcements
enable row level security;

grant select
on public.platform_announcements
to anon, authenticated;

grant insert, update, delete
on public.platform_announcements
to authenticated;

grant all privileges
on public.platform_announcements
to service_role;

drop policy if exists
announcements_public_read
on public.platform_announcements;

drop policy if exists
announcements_admin_manage
on public.platform_announcements;

create policy announcements_public_read
on public.platform_announcements
for select
to anon, authenticated
using (
  is_published = true
  and (
    publish_at is null
    or publish_at <= now()
  )
  and (
    expires_at is null
    or expires_at > now()
  )
);

create policy announcements_admin_manage
on public.platform_announcements
for all
to authenticated
using (
  public.has_role('admin')
  or public.has_role('publisher')
  or public.has_role('editor')
)
with check (
  public.has_role('admin')
  or public.has_role('publisher')
  or public.has_role('editor')
);

drop trigger if exists
set_platform_announcements_updated_at
on public.platform_announcements;

create trigger
set_platform_announcements_updated_at
before update
on public.platform_announcements
for each row
execute function public.set_updated_at();


-- =========================================================
-- 6. NOTIFICATION EVENTS
-- =========================================================

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),

  event_type text not null,

  title text not null
    check (
      char_length(btrim(title))
      between 1 and 200
    ),

  message text not null
    check (
      char_length(btrim(message))
      between 1 and 5000
    ),

  link_url text,

  announcement_id uuid
    references public.platform_announcements(id)
    on delete cascade,

  deadline_id uuid
    references public.user_deadlines(id)
    on delete cascade,

  user_id uuid
    references auth.users(id)
    on delete cascade,

  scheduled_for timestamptz not null default now(),

  status text not null default 'pending',

  attempts integer not null default 0,

  last_error text,

  processed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    event_type in (
      'deadline_reminder',
      'scholarship_update',
      'programme_update',
      'general_announcement',
      'system'
    )
  ),

  check (
    status in (
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled'
    )
  ),

  check (
    attempts >= 0
  )
);

create index if not exists
notification_events_processing_idx
on public.notification_events(
  status,
  scheduled_for
);

create index if not exists
notification_events_user_idx
on public.notification_events(
  user_id,
  created_at desc
);

alter table public.notification_events
enable row level security;

grant select
on public.notification_events
to authenticated;

grant insert, update, delete
on public.notification_events
to authenticated;

grant all privileges
on public.notification_events
to service_role;

drop policy if exists
notification_events_own_read
on public.notification_events;

drop policy if exists
notification_events_admin_manage
on public.notification_events;

create policy notification_events_own_read
on public.notification_events
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_role('admin')
);

create policy notification_events_admin_manage
on public.notification_events
for all
to authenticated
using (
  public.has_role('admin')
)
with check (
  public.has_role('admin')
);

drop trigger if exists
set_notification_events_updated_at
on public.notification_events;

create trigger set_notification_events_updated_at
before update
on public.notification_events
for each row
execute function public.set_updated_at();


-- =========================================================
-- 7. EMAIL DELIVERY TRACKING
-- =========================================================

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),

  event_id uuid not null
    references public.notification_events(id)
    on delete cascade,

  user_id uuid
    references auth.users(id)
    on delete set null,

  recipient_email text not null,

  provider text not null default 'resend',

  provider_message_id text,

  status text not null default 'queued',

  error_message text,

  sent_at timestamptz,
  delivered_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(event_id, recipient_email),

  check (
    status in (
      'queued',
      'sent',
      'delivered',
      'failed',
      'bounced',
      'cancelled'
    )
  )
);

create index if not exists
notification_deliveries_event_idx
on public.notification_deliveries(event_id);

create index if not exists
notification_deliveries_status_idx
on public.notification_deliveries(
  status,
  created_at
);

alter table public.notification_deliveries
enable row level security;

grant select
on public.notification_deliveries
to authenticated;

grant all privileges
on public.notification_deliveries
to service_role;

drop policy if exists
notification_deliveries_own_read
on public.notification_deliveries;

drop policy if exists
notification_deliveries_admin_read
on public.notification_deliveries;

create policy notification_deliveries_own_read
on public.notification_deliveries
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy notification_deliveries_admin_read
on public.notification_deliveries
for select
to authenticated
using (
  public.has_role('admin')
);

drop trigger if exists
set_notification_deliveries_updated_at
on public.notification_deliveries;

create trigger set_notification_deliveries_updated_at
before update
on public.notification_deliveries
for each row
execute function public.set_updated_at();


-- =========================================================
-- 8. CREATE DEADLINE NOTIFICATION EVENTS
-- =========================================================

create or replace function
public.queue_deadline_reminder_events()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inserted_count integer;
begin
  insert into public.notification_events (
    event_type,
    title,
    message,
    link_url,
    deadline_id,
    user_id,
    scheduled_for
  )
  select
    'deadline_reminder',
    'Upcoming deadline: ' || deadlines.title,
    case
      when deadlines.notes is null
        or btrim(deadlines.notes) = ''
      then
        'Your deadline is due on '
        || to_char(
          deadlines.due_date,
          'DD Mon YYYY'
        )
        || '.'
      else
        'Your deadline is due on '
        || to_char(
          deadlines.due_date,
          'DD Mon YYYY'
        )
        || '. '
        || deadlines.notes
    end,
    '/workspace/deadlines',
    deadlines.id,
    deadlines.user_id,
    now()
  from public.user_deadlines deadlines
  join public.user_alert_preferences preferences
    on preferences.user_id = deadlines.user_id
  where deadlines.is_completed = false
    and preferences.email_notifications = true
    and preferences.deadline_reminders = true
    and deadlines.due_date between
      current_date
      and (
        current_date
        + preferences.deadline_reminder_days
      )
    and not exists (
      select 1
      from public.notification_events existing
      where existing.deadline_id = deadlines.id
        and existing.event_type =
          'deadline_reminder'
        and existing.created_at::date =
          current_date
        and existing.status not in (
          'cancelled',
          'failed'
        )
    );

  get diagnostics inserted_count = row_count;

  return inserted_count;
end;
$$;

revoke all
on function
public.queue_deadline_reminder_events()
from public, anon, authenticated;

grant execute
on function
public.queue_deadline_reminder_events()
to service_role;


-- =========================================================
-- 9. ADMIN DASHBOARD METRICS
-- =========================================================

create or replace function
public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required';
  end if;

  return jsonb_build_object(
    'users',
    (
      select count(*)
      from auth.users
    ),
    'profiles',
    (
      select count(*)
      from public.profiles
    ),
    'universities',
    (
      select count(*)
      from public.universities
    ),
    'programmes',
    (
      select count(*)
      from public.programmes
    ),
    'accommodations',
    (
      select count(*)
      from public.accommodations
    ),
    'saved_universities',
    (
      select count(*)
      from public.university_favorites
    ),
    'comparisons',
    (
      select count(*)
      from public.university_comparison_items
    ),
    'searches',
    (
      select count(*)
      from public.search_history
    ),
    'pending_housing_inquiries',
    (
      select count(*)
      from public.housing_inquiries
      where status = 'pending'
    ),
    'reviews',
    (
      select count(*)
      from public.accommodation_reviews
    ),
    'pending_notifications',
    (
      select count(*)
      from public.notification_events
      where status = 'pending'
    )
  );
end;
$$;

revoke all
on function
public.get_admin_dashboard_metrics()
from public, anon;

grant execute
on function
public.get_admin_dashboard_metrics()
to authenticated, service_role;


-- =========================================================
-- 10. ADMIN USER LIST
-- =========================================================

create or replace function
public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  roles public.user_role[],
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required';
  end if;

  return query
  select
    users.id,
    users.email::text,
    profiles.full_name,
    coalesce(
      array_agg(
        user_roles.role
        order by user_roles.role
      ) filter (
        where user_roles.role is not null
      ),
      '{}'::public.user_role[]
    ),
    users.created_at,
    users.last_sign_in_at
  from auth.users users
  left join public.profiles profiles
    on profiles.id = users.id
  left join public.user_roles user_roles
    on user_roles.user_id = users.id
  group by
    users.id,
    users.email,
    profiles.full_name,
    users.created_at,
    users.last_sign_in_at
  order by users.created_at desc;
end;
$$;

revoke all
on function public.admin_list_users()
from public, anon;

grant execute
on function public.admin_list_users()
to authenticated, service_role;


-- =========================================================
-- 11. ADMIN ROLE MANAGEMENT
-- =========================================================

create or replace function
public.admin_set_user_role(
  target_user_id uuid,
  target_role public.user_role,
  enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required';
  end if;

  if target_user_id is null then
    raise exception 'Target user is required';
  end if;

  if enabled then
    insert into public.user_roles (
      user_id,
      role
    )
    values (
      target_user_id,
      target_role
    )
    on conflict (user_id, role) do nothing;
  else
    if target_role = 'student' then
      raise exception
        'The default student role cannot be removed';
    end if;

    if target_role = 'admin'
       and target_user_id = auth.uid()
    then
      raise exception
        'You cannot remove your own admin role';
    end if;

    delete from public.user_roles
    where user_id = target_user_id
      and role = target_role;
  end if;
end;
$$;

revoke all
on function
public.admin_set_user_role(
  uuid,
  public.user_role,
  boolean
)
from public, anon;

grant execute
on function
public.admin_set_user_role(
  uuid,
  public.user_role,
  boolean
)
to authenticated, service_role;


-- =========================================================
-- 12. ADMIN HOUSING INQUIRY STATUS
-- =========================================================

create or replace function
public.admin_update_housing_inquiry_status(
  inquiry_id uuid,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required';
  end if;

  if new_status not in (
    'pending',
    'in_progress',
    'resolved',
    'closed'
  ) then
    raise exception 'Invalid inquiry status';
  end if;

  update public.housing_inquiries
  set status = new_status
  where id = inquiry_id;

  if not found then
    raise exception 'Housing inquiry not found';
  end if;
end;
$$;

revoke all
on function
public.admin_update_housing_inquiry_status(
  uuid,
  text
)
from public, anon;

grant execute
on function
public.admin_update_housing_inquiry_status(
  uuid,
  text
)
to authenticated, service_role;


-- =========================================================
-- 13. SERVICE ROLE PRIVILEGES
-- =========================================================

grant all privileges
on public.accommodation_reviews,
   public.platform_announcements,
   public.notification_events,
   public.notification_deliveries
to service_role;

commit;


-- =========================================================
-- 14. VERIFICATION
-- =========================================================

select
  to_regclass(
    'public.platform_announcements'
  ) as announcements_table,

  to_regclass(
    'public.notification_events'
  ) as notification_events_table,

  to_regclass(
    'public.notification_deliveries'
  ) as notification_deliveries_table,

  to_regclass(
    'public.accommodation_reviews_public'
  ) as reviews_public_view,

  to_regprocedure(
    'public.get_admin_dashboard_metrics()'
  ) as admin_metrics_function,

  to_regprocedure(
    'public.admin_list_users()'
  ) as admin_users_function,

  to_regprocedure(
    'public.queue_deadline_reminder_events()'
  ) as deadline_queue_function,

  exists (
    select 1
    from pg_trigger
    where tgname =
      'accommodation_review_summary_trigger'
      and not tgisinternal
  ) as review_summary_trigger_created,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.platform_announcements'::regclass
  ) as announcements_rls_enabled,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.notification_events'::regclass
  ) as notification_events_rls_enabled,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.notification_deliveries'::regclass
  ) as notification_deliveries_rls_enabled;