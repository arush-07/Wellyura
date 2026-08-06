-- 13_accommodation_workflows.sql
-- Accommodation inquiries, reviews and student housing workspace.
-- Safe to run more than once.

begin;


-- =========================================================
-- 1. TABLE UPGRADES
-- =========================================================

alter table public.housing_inquiries
  add column if not exists updated_at
  timestamptz not null default now();

alter table public.accommodation_reviews
  add column if not exists updated_at
  timestamptz not null default now();


-- One review per signed-in user per accommodation.
create unique index if not exists
accommodation_reviews_user_accommodation_unique_idx
on public.accommodation_reviews (
  user_id,
  accommodation_id
)
where user_id is not null;


create index if not exists
housing_inquiries_user_created_idx
on public.housing_inquiries (
  user_id,
  created_at desc
);


create index if not exists
housing_inquiries_accommodation_created_idx
on public.housing_inquiries (
  accommodation_id,
  created_at desc
);


create index if not exists
accommodation_reviews_accommodation_created_idx
on public.accommodation_reviews (
  accommodation_id,
  created_at desc
);


-- =========================================================
-- 2. ROW LEVEL SECURITY
-- =========================================================

alter table public.housing_inquiries
enable row level security;

alter table public.accommodation_reviews
enable row level security;


grant select, insert, update, delete
on public.housing_inquiries
to authenticated;

grant select
on public.accommodation_reviews
to anon, authenticated;

grant insert, update, delete
on public.accommodation_reviews
to authenticated;

grant all privileges
on public.housing_inquiries
to service_role;

grant all privileges
on public.accommodation_reviews
to service_role;


-- Housing inquiries

drop policy if exists
housing_inquiries_student_select_v13
on public.housing_inquiries;

create policy
housing_inquiries_student_select_v13
on public.housing_inquiries
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.has_role('admin')
);


drop policy if exists
housing_inquiries_student_insert_v13
on public.housing_inquiries;

create policy
housing_inquiries_student_insert_v13
on public.housing_inquiries
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);


drop policy if exists
housing_inquiries_admin_manage_v13
on public.housing_inquiries;

create policy
housing_inquiries_admin_manage_v13
on public.housing_inquiries
for all
to authenticated
using (
  public.has_role('admin')
)
with check (
  public.has_role('admin')
);


-- Accommodation reviews

drop policy if exists
accommodation_reviews_public_read_v13
on public.accommodation_reviews;

create policy
accommodation_reviews_public_read_v13
on public.accommodation_reviews
for select
to anon, authenticated
using (true);


drop policy if exists
accommodation_reviews_student_insert_v13
on public.accommodation_reviews;

create policy
accommodation_reviews_student_insert_v13
on public.accommodation_reviews
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);


drop policy if exists
accommodation_reviews_student_update_v13
on public.accommodation_reviews;

create policy
accommodation_reviews_student_update_v13
on public.accommodation_reviews
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);


drop policy if exists
accommodation_reviews_student_delete_v13
on public.accommodation_reviews;

create policy
accommodation_reviews_student_delete_v13
on public.accommodation_reviews
for delete
to authenticated
using (
  user_id = (select auth.uid())
);


drop policy if exists
accommodation_reviews_admin_manage_v13
on public.accommodation_reviews;

create policy
accommodation_reviews_admin_manage_v13
on public.accommodation_reviews
for all
to authenticated
using (
  public.has_role('admin')
)
with check (
  public.has_role('admin')
);


-- =========================================================
-- 3. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists
set_housing_inquiries_updated_at_v13
on public.housing_inquiries;

create trigger
set_housing_inquiries_updated_at_v13
before update
on public.housing_inquiries
for each row
execute function public.set_updated_at();


drop trigger if exists
set_accommodation_reviews_updated_at_v13
on public.accommodation_reviews;

create trigger
set_accommodation_reviews_updated_at_v13
before update
on public.accommodation_reviews
for each row
execute function public.set_updated_at();


-- =========================================================
-- 4. RESOLVE ACCOMMODATION KEY
-- =========================================================
-- Accepts accommodation slug, legacy ID or UUID.

create or replace function public.resolve_accommodation_key(
  p_key text
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select accommodations.id
  from public.accommodations accommodations
  where accommodations.slug =
          nullif(btrim(p_key), '')

     or accommodations.legacy_id =
          nullif(btrim(p_key), '')

     or accommodations.id::text =
          nullif(btrim(p_key), '')

  order by
    case
      when accommodations.slug =
        nullif(btrim(p_key), '')
      then 1

      when accommodations.legacy_id =
        nullif(btrim(p_key), '')
      then 2

      else 3
    end

  limit 1;
$$;


-- =========================================================
-- 5. SUBMIT HOUSING INQUIRY
-- =========================================================

create or replace function public.submit_housing_inquiry(
  p_accommodation_key text,
  p_room_type text default null,
  p_check_in_date date default null,
  p_check_out_date date default null,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_accommodation_id uuid;
  clean_room_type text;
  clean_message text;
  existing_inquiry_id uuid;
  new_inquiry_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  target_accommodation_id :=
    public.resolve_accommodation_key(
      p_accommodation_key
    );

  if target_accommodation_id is null then
    raise exception
      'Accommodation not found for key: %',
      p_accommodation_key;
  end if;

  clean_room_type :=
    nullif(btrim(coalesce(p_room_type, '')), '');

  clean_message :=
    nullif(btrim(coalesce(p_message, '')), '');

  if clean_message is null then
    raise exception
      'Please enter a message';
  end if;

  if char_length(clean_message) < 10 then
    raise exception
      'Your message must contain at least 10 characters';
  end if;

  if p_check_in_date is not null
     and p_check_in_date < current_date
  then
    raise exception
      'Check-in date cannot be in the past';
  end if;

  if p_check_out_date is not null
     and p_check_in_date is null
  then
    raise exception
      'Select a check-in date before selecting check-out';
  end if;

  if p_check_in_date is not null
     and p_check_out_date is not null
     and p_check_out_date <= p_check_in_date
  then
    raise exception
      'Check-out date must be after check-in date';
  end if;

  -- Prevent accidental duplicate submissions.
  select inquiries.id
  into existing_inquiry_id
  from public.housing_inquiries inquiries
  where inquiries.user_id = current_user_id
    and inquiries.accommodation_id =
          target_accommodation_id
    and inquiries.message = clean_message
    and inquiries.created_at >=
          now() - interval '5 minutes'
  order by inquiries.created_at desc
  limit 1;

  if existing_inquiry_id is not null then
    return existing_inquiry_id;
  end if;

  insert into public.housing_inquiries (
    user_id,
    accommodation_id,
    room_type,
    check_in_date,
    check_out_date,
    message,
    status
  )
  values (
    current_user_id,
    target_accommodation_id,
    clean_room_type,
    p_check_in_date,
    p_check_out_date,
    clean_message,
    'pending'
  )
  returning id into new_inquiry_id;

  return new_inquiry_id;
end;
$$;


-- =========================================================
-- 6. SUBMIT OR UPDATE REVIEW
-- =========================================================

create or replace function public.submit_accommodation_review(
  p_accommodation_key text,
  p_rating numeric,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_accommodation_id uuid;
  clean_comment text;
  review_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  target_accommodation_id :=
    public.resolve_accommodation_key(
      p_accommodation_key
    );

  if target_accommodation_id is null then
    raise exception
      'Accommodation not found for key: %',
      p_accommodation_key;
  end if;

  if p_rating is null
     or p_rating < 1
     or p_rating > 5
  then
    raise exception
      'Rating must be between 1 and 5';
  end if;

  clean_comment :=
    nullif(btrim(coalesce(p_comment, '')), '');

  if clean_comment is not null
     and char_length(clean_comment) > 1000
  then
    raise exception
      'Review must be 1000 characters or fewer';
  end if;

  insert into public.accommodation_reviews (
    user_id,
    accommodation_id,
    rating,
    comment
  )
  values (
    current_user_id,
    target_accommodation_id,
    p_rating,
    clean_comment
  )
  on conflict (
    user_id,
    accommodation_id
  )
  where user_id is not null
  do update
  set
    rating = excluded.rating,
    comment = excluded.comment,
    updated_at = now()
  returning id into review_id;

  return review_id;
end;
$$;


-- =========================================================
-- 7. DELETE OWN REVIEW
-- =========================================================

create or replace function public.delete_my_accommodation_review(
  p_review_id uuid
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

  delete from public.accommodation_reviews
  where id = p_review_id
    and user_id = current_user_id;

  get diagnostics deleted_count = row_count;

  return deleted_count > 0;
end;
$$;


-- =========================================================
-- 8. GET PUBLIC REVIEWS
-- =========================================================

create or replace function public.get_accommodation_reviews(
  p_accommodation_key text
)
returns table (
  review_id uuid,
  rating numeric,
  comment text,
  author_name text,
  created_at timestamptz,
  updated_at timestamptz,
  is_mine boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    reviews.id as review_id,
    reviews.rating,
    reviews.comment,

    coalesce(
      nullif(profiles.full_name, ''),
      'Wellyura student'
    ) as author_name,

    reviews.created_at,
    reviews.updated_at,

    (
      auth.uid() is not null
      and reviews.user_id = auth.uid()
    ) as is_mine

  from public.accommodation_reviews reviews

  left join public.profiles profiles
    on profiles.id = reviews.user_id

  where reviews.accommodation_id =
    public.resolve_accommodation_key(
      p_accommodation_key
    )

  order by reviews.created_at desc;
$$;


-- =========================================================
-- 9. GET SIGNED-IN USER INQUIRIES
-- =========================================================

create or replace function public.get_my_housing_inquiries()
returns table (
  inquiry_id uuid,
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
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    inquiries.id,
    accommodations.id,
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

  left join public.accommodations accommodations
    on accommodations.id =
       inquiries.accommodation_id

  where inquiries.user_id = auth.uid()

  order by inquiries.created_at desc;
end;
$$;


-- =========================================================
-- 10. FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.resolve_accommodation_key(text)
from public;

revoke all
on function public.submit_housing_inquiry(
  text,
  text,
  date,
  date,
  text
)
from public, anon;

revoke all
on function public.submit_accommodation_review(
  text,
  numeric,
  text
)
from public, anon;

revoke all
on function public.delete_my_accommodation_review(uuid)
from public, anon;

revoke all
on function public.get_accommodation_reviews(text)
from public;

revoke all
on function public.get_my_housing_inquiries()
from public, anon;


grant execute
on function public.resolve_accommodation_key(text)
to anon, authenticated, service_role;

grant execute
on function public.submit_housing_inquiry(
  text,
  text,
  date,
  date,
  text
)
to authenticated, service_role;

grant execute
on function public.submit_accommodation_review(
  text,
  numeric,
  text
)
to authenticated, service_role;

grant execute
on function public.delete_my_accommodation_review(uuid)
to authenticated, service_role;

grant execute
on function public.get_accommodation_reviews(text)
to anon, authenticated, service_role;

grant execute
on function public.get_my_housing_inquiries()
to authenticated, service_role;


commit;


-- =========================================================
-- 11. VERIFICATION
-- =========================================================

select
  to_regclass(
    'public.housing_inquiries'
  ) as housing_inquiries_table,

  to_regclass(
    'public.accommodation_reviews'
  ) as accommodation_reviews_table,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.housing_inquiries'::regclass
  ) as inquiries_rls_enabled,

  (
    select relrowsecurity
    from pg_class
    where oid =
      'public.accommodation_reviews'::regclass
  ) as reviews_rls_enabled,

  to_regprocedure(
    'public.resolve_accommodation_key(text)'
  ) as accommodation_resolver,

  to_regprocedure(
    'public.submit_housing_inquiry(text,text,date,date,text)'
  ) as inquiry_function,

  to_regprocedure(
    'public.submit_accommodation_review(text,numeric,text)'
  ) as review_function,

  to_regprocedure(
    'public.delete_my_accommodation_review(uuid)'
  ) as delete_review_function,

  to_regprocedure(
    'public.get_accommodation_reviews(text)'
  ) as public_reviews_function,

  to_regprocedure(
    'public.get_my_housing_inquiries()'
  ) as user_inquiries_function;