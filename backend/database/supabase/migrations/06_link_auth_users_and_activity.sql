-- Link Supabase Auth users to imported legacy users and restore user-owned activity.
-- First create/invite each user in Authentication > Users with the exact legacy email address.
-- Legacy password hashes remain only in legacy.users_raw and are never copied.

begin;

insert into public.profiles(id,legacy_id,full_name,phone,preferred_country_id,recently_viewed,created_at)
select au.id,r.id,nullif(btrim(r.full_name),''),nullif(btrim(r.phone),''),c.id,
       case when jsonb_typeof(internal.safe_jsonb(r.recently_viewed))='array' then internal.safe_jsonb(r.recently_viewed) else '[]'::jsonb end,
       case when nullif(btrim(r.created_at),'') is null then now() else r.created_at::timestamptz end
from legacy.users_raw r
join auth.users au on lower(btrim(au.email))=lower(btrim(r.email))
left join public.countries c on lower(c.name)=lower(case btrim(r.preferred_country) when 'USA' then 'United States' when 'UK' then 'United Kingdom' else btrim(r.preferred_country) end)
on conflict(id) do update set legacy_id=excluded.legacy_id,full_name=excluded.full_name,phone=excluded.phone,
  preferred_country_id=excluded.preferred_country_id,recently_viewed=excluded.recently_viewed,updated_at=now();

insert into public.user_roles(user_id,role)
select au.id,case when lower(coalesce(r.is_admin,'false')) in ('true','t','1','yes') then 'admin'::public.user_role else 'student'::public.user_role end
from legacy.users_raw r join auth.users au on lower(btrim(au.email))=lower(btrim(r.email))
on conflict(user_id,role) do nothing;

insert into public.university_favorites(legacy_id,user_id,university_id,created_at)
select f.id,au.id,u.id,
       case when nullif(btrim(f.created_at),'') is null then now() else f.created_at::timestamptz end
from legacy.favorites_raw f
join legacy.users_raw lr on lr.id=f.user_id
join auth.users au on lower(btrim(au.email))=lower(btrim(lr.email))
join public.universities u on u.legacy_id=f.institution_id
on conflict(legacy_id) do update set user_id=excluded.user_id,university_id=excluded.university_id;

insert into public.search_history(legacy_id,user_id,query,filters,created_at)
select h.id,au.id,nullif(h.query,''),internal.safe_jsonb(h.filters),
       case when nullif(btrim(h.created_at),'') is null then now() else h.created_at::timestamptz end
from legacy.search_history_raw h
join legacy.users_raw lr on lr.id=h.user_id
join auth.users au on lower(btrim(au.email))=lower(btrim(lr.email))
on conflict(legacy_id) do update set user_id=excluded.user_id,query=excluded.query,filters=excluded.filters;

commit;

select
  (select count(*) from legacy.users_raw) legacy_users,
  (select count(*) from public.profiles where legacy_id is not null) linked_profiles,
  (select count(*) from legacy.favorites_raw) legacy_favorites,
  (select count(*) from public.university_favorites where legacy_id is not null) migrated_favorites,
  (select count(*) from legacy.search_history_raw) legacy_searches,
  (select count(*) from public.search_history where legacy_id is not null) migrated_searches;
