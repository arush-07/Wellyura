-- Final end-to-end verification

select
  (select count(*) from public.universities) universities,
  (select count(*) from public.programmes) programmes,
  (select count(*) from public.accommodations) accommodations,
  (select count(*) from public.profiles where legacy_id is not null) migrated_users,
  (select count(*) from public.university_favorites where legacy_id is not null) favorites,
  (select count(*) from public.search_history where legacy_id is not null) search_history,
  (select count(*) from public.contact_messages where legacy_id is not null) contact_messages;

select r.id legacy_user_id,r.email,
       case when au.id is null then 'AUTH USER MISSING' else 'LINKED' end status
from legacy.users_raw r
left join auth.users au on lower(btrim(au.email))=lower(btrim(r.email))
order by r.email;

select 'programme_without_university' issue,count(*) count
from public.programmes p left join public.universities u on u.id=p.university_id where u.id is null
union all
select 'favorite_without_user',count(*) from public.university_favorites f left join auth.users u on u.id=f.user_id where u.id is null
union all
select 'favorite_without_university',count(*) from public.university_favorites f left join public.universities u on u.id=f.university_id where u.id is null
union all
select 'search_without_user',count(*) from public.search_history h left join auth.users u on u.id=h.user_id where u.id is null;

select schemaname,tablename,policyname,roles,cmd
from pg_policies
where schemaname='public'
order by tablename,policyname;
