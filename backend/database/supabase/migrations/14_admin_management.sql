-- 14_admin_management.sql
-- Admin management functions for housing inquiries,
-- accommodation reviews and platform announcements.
-- Safe to run more than once.

begin;


-- =========================================================
-- 1. VALIDATE HOUSING INQUIRY STATUS
-- =========================================================

alter table public.housing_inquiries
drop constraint if exists
housing_inquiries_status_check;

alter table public.housing_inquiries
add constraint housing_inquiries_status_check
check (
  status in (
    'pending',
    'contacted',
    'approved',
    'confirmed',
    'rejected',
    'cancelled'
  )
);


-- =========================================================
-- 2. ADMIN HOUSING INQUIRY LIST
-- =========================================================

create or replace function public.admin_list_housing_inquiries()
returns table (
  inquiry_id uuid,
  user_id uuid,
  user_email text,
  student_name text,
  accommodation_id uuid,
  accommodation_slug text,
  accommodation_name text,
  room_type text,
  check_in_date date,
  check_out_date date,
  message text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  return query
  select
    inquiries.id,
    inquiries.user_id,
    auth_users.email::text,

    coalesce(
      nullif(profiles.full_name, ''),
      split_part(
        auth_users.email::text,
        '@',
        1
      ),
      'Student'
    )::text,

    inquiries.accommodation_id,
    accommodations.slug,
    accommodations.name,
    inquiries.room_type,
    inquiries.check_in_date,
    inquiries.check_out_date,
    inquiries.message,
    inquiries.status,
    inquiries.created_at,
    inquiries.updated_at

  from public.housing_inquiries inquiries

  left join auth.users auth_users
    on auth_users.id = inquiries.user_id

  left join public.profiles profiles
    on profiles.id = inquiries.user_id

  left join public.accommodations accommodations
    on accommodations.id =
       inquiries.accommodation_id

  order by inquiries.created_at desc;
end;
$$;


-- =========================================================
-- 3. UPDATE HOUSING INQUIRY STATUS
-- =========================================================

create or replace function public.admin_set_housing_inquiry_status(
  p_inquiry_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_status text :=
    lower(
      btrim(
        coalesce(
          p_status,
          ''
        )
      )
    );
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  if clean_status not in (
    'pending',
    'contacted',
    'approved',
    'confirmed',
    'rejected',
    'cancelled'
  ) then
    raise exception
      'Invalid housing inquiry status: %',
      p_status;
  end if;

  update public.housing_inquiries
  set
    status = clean_status,
    updated_at = now()
  where id = p_inquiry_id;

  if not found then
    raise exception
      'Housing inquiry not found';
  end if;
end;
$$;


-- =========================================================
-- 4. ADMIN ACCOMMODATION REVIEW LIST
-- =========================================================

create or replace function public.admin_list_accommodation_reviews()
returns table (
  review_id uuid,
  user_id uuid,
  user_email text,
  author_name text,
  accommodation_id uuid,
  accommodation_slug text,
  accommodation_name text,
  rating numeric,
  comment text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  return query
  select
    reviews.id,
    reviews.user_id,
    auth_users.email::text,

    coalesce(
      nullif(profiles.full_name, ''),
      split_part(
        auth_users.email::text,
        '@',
        1
      ),
      'Wellyura student'
    )::text,

    reviews.accommodation_id,
    accommodations.slug,
    accommodations.name,
    reviews.rating,
    reviews.comment,
    reviews.created_at,
    reviews.updated_at

  from public.accommodation_reviews reviews

  left join auth.users auth_users
    on auth_users.id = reviews.user_id

  left join public.profiles profiles
    on profiles.id = reviews.user_id

  left join public.accommodations accommodations
    on accommodations.id =
       reviews.accommodation_id

  order by reviews.created_at desc;
end;
$$;


-- =========================================================
-- 5. ADMIN DELETE ACCOMMODATION REVIEW
-- =========================================================

create or replace function public.admin_delete_accommodation_review(
  p_review_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  delete from public.accommodation_reviews
  where id = p_review_id;

  get diagnostics deleted_count = row_count;

  return deleted_count > 0;
end;
$$;


-- =========================================================
-- 6. ADMIN ANNOUNCEMENT LIST
-- =========================================================

create or replace function public.admin_list_announcements()
returns table (
  announcement_id uuid,
  announcement_type text,
  title text,
  message text,
  link_url text,
  target_country_id uuid,
  target_university_id uuid,
  target_programme_id uuid,
  is_published boolean,
  publish_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  return query
  select
    announcements.id,
    announcements.announcement_type,
    announcements.title,
    announcements.message,
    announcements.link_url,
    announcements.target_country_id,
    announcements.target_university_id,
    announcements.target_programme_id,
    announcements.is_published,
    announcements.publish_at,
    announcements.expires_at,
    announcements.created_by,
    announcements.created_at,
    announcements.updated_at

  from public.platform_announcements announcements

  order by announcements.created_at desc;
end;
$$;


-- =========================================================
-- 7. CREATE ANNOUNCEMENT
-- =========================================================

create or replace function public.admin_create_announcement(
  p_announcement_type text,
  p_title text,
  p_message text,
  p_link_url text default null,
  p_is_published boolean default false,
  p_publish_at timestamptz default null,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  clean_type text;
  clean_title text;
  clean_message text;
  announcement_id uuid;
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  clean_type :=
    lower(
      btrim(
        coalesce(
          p_announcement_type,
          'general'
        )
      )
    );

  if clean_type not in (
    'general',
    'scholarship',
    'programme',
    'deadline',
    'system'
  ) then
    raise exception
      'Invalid announcement type: %',
      p_announcement_type;
  end if;

  clean_title :=
    nullif(
      btrim(
        coalesce(
          p_title,
          ''
        )
      ),
      ''
    );

  clean_message :=
    nullif(
      btrim(
        coalesce(
          p_message,
          ''
        )
      ),
      ''
    );

  if clean_title is null then
    raise exception
      'Announcement title is required';
  end if;

  if clean_message is null then
    raise exception
      'Announcement message is required';
  end if;

  if p_expires_at is not null
     and p_publish_at is not null
     and p_expires_at <= p_publish_at
  then
    raise exception
      'Expiry time must be after publish time';
  end if;

  insert into public.platform_announcements (
    announcement_type,
    title,
    message,
    link_url,
    is_published,
    publish_at,
    expires_at,
    created_by
  )
  values (
    clean_type,
    clean_title,
    clean_message,
    nullif(
      btrim(
        coalesce(
          p_link_url,
          ''
        )
      ),
      ''
    ),
    coalesce(
      p_is_published,
      false
    ),
    case
      when coalesce(
        p_is_published,
        false
      )
      then coalesce(
        p_publish_at,
        now()
      )
      else p_publish_at
    end,
    p_expires_at,
    current_user_id
  )
  returning id
  into announcement_id;

  return announcement_id;
end;
$$;


-- =========================================================
-- 8. UPDATE ANNOUNCEMENT PUBLISH STATE
-- =========================================================

create or replace function public.admin_set_announcement_published(
  p_announcement_id uuid,
  p_is_published boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  update public.platform_announcements
  set
    is_published =
      coalesce(
        p_is_published,
        false
      ),

    publish_at =
      case
        when coalesce(
          p_is_published,
          false
        )
        then coalesce(
          publish_at,
          now()
        )
        else publish_at
      end,

    updated_at = now()

  where id = p_announcement_id;

  if not found then
    raise exception
      'Announcement not found';
  end if;
end;
$$;


-- =========================================================
-- 9. DELETE ANNOUNCEMENT
-- =========================================================

create or replace function public.admin_delete_announcement(
  p_announcement_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if not public.has_role('admin') then
    raise exception 'Admin access required';
  end if;

  delete from public.platform_announcements
  where id = p_announcement_id;

  get diagnostics deleted_count = row_count;

  return deleted_count > 0;
end;
$$;


-- =========================================================
-- 10. CREATE NOTIFICATION EVENT WHEN PUBLISHED
-- =========================================================

create or replace function public.create_announcement_notification_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_published = true
     and (
       old.is_published is distinct from true
       or old is null
     )
  then
    insert into public.notification_events (
      event_type,
      title,
      message,
      link_url,
      announcement_id,
      scheduled_for,
      status
    )
    values (
      new.announcement_type,
      new.title,
      new.message,
      new.link_url,
      new.id,
      coalesce(
        new.publish_at,
        now()
      ),
      'pending'
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;


drop trigger if exists
create_announcement_notification_event_trigger
on public.platform_announcements;

create trigger
create_announcement_notification_event_trigger
after insert or update of is_published
on public.platform_announcements
for each row
execute function
public.create_announcement_notification_event();


-- =========================================================
-- 11. FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.admin_list_housing_inquiries()
from public, anon;

revoke all
on function public.admin_set_housing_inquiry_status(
  uuid,
  text
)
from public, anon;

revoke all
on function public.admin_list_accommodation_reviews()
from public, anon;

revoke all
on function public.admin_delete_accommodation_review(uuid)
from public, anon;

revoke all
on function public.admin_list_announcements()
from public, anon;

revoke all
on function public.admin_create_announcement(
  text,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz
)
from public, anon;

revoke all
on function public.admin_set_announcement_published(
  uuid,
  boolean
)
from public, anon;

revoke all
on function public.admin_delete_announcement(uuid)
from public, anon;


grant execute
on function public.admin_list_housing_inquiries()
to authenticated, service_role;

grant execute
on function public.admin_set_housing_inquiry_status(
  uuid,
  text
)
to authenticated, service_role;

grant execute
on function public.admin_list_accommodation_reviews()
to authenticated, service_role;

grant execute
on function public.admin_delete_accommodation_review(uuid)
to authenticated, service_role;

grant execute
on function public.admin_list_announcements()
to authenticated, service_role;

grant execute
on function public.admin_create_announcement(
  text,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz
)
to authenticated, service_role;

grant execute
on function public.admin_set_announcement_published(
  uuid,
  boolean
)
to authenticated, service_role;

grant execute
on function public.admin_delete_announcement(uuid)
to authenticated, service_role;


commit;


-- =========================================================
-- 12. VERIFICATION
-- =========================================================

select
  to_regprocedure(
    'public.admin_list_housing_inquiries()'
  ) as list_inquiries,

  to_regprocedure(
    'public.admin_set_housing_inquiry_status(uuid,text)'
  ) as update_inquiry_status,

  to_regprocedure(
    'public.admin_list_accommodation_reviews()'
  ) as list_reviews,

  to_regprocedure(
    'public.admin_delete_accommodation_review(uuid)'
  ) as delete_review,

  to_regprocedure(
    'public.admin_list_announcements()'
  ) as list_announcements,

  to_regprocedure(
    'public.admin_create_announcement(text,text,text,text,boolean,timestamptz,timestamptz)'
  ) as create_announcement,

  to_regprocedure(
    'public.admin_set_announcement_published(uuid,boolean)'
  ) as update_announcement,

  to_regprocedure(
    'public.admin_delete_announcement(uuid)'
  ) as delete_announcement;