-- Catalogue migration verification. Expected core totals: 268 universities, 4102 programmes, 2 accommodations.

select 'legacy.universities_raw' table_name,count(*) row_count from legacy.universities_raw
union all select 'public.universities',count(*) from public.universities
union all select 'legacy.programmes_raw',count(*) from legacy.programmes_raw
union all select 'public.programmes',count(*) from public.programmes
union all select 'legacy.accommodations_raw',count(*) from legacy.accommodations_raw
union all select 'public.accommodations',count(*) from public.accommodations
union all select 'public.countries',count(*) from public.countries
union all select 'public.cities',count(*) from public.cities
order by table_name;

select count(*) as orphan_programmes
from public.programmes p
left join public.universities u on u.id=p.university_id
where u.id is null;

select count(*) as duplicate_university_legacy_ids
from (select legacy_id from public.universities group by legacy_id having count(*)>1) x;

select count(*) as duplicate_programme_legacy_ids
from (select legacy_id from public.programmes group by legacy_id having count(*)>1) x;

select entity_type,field_name,count(*) issue_count
from internal.import_issues
group by entity_type,field_name
order by issue_count desc;

select
  (select count(*) from legacy.universities_raw)=(select count(*) from public.universities) as universities_match,
  (select count(*) from legacy.programmes_raw)=(select count(*) from public.programmes) as programmes_match,
  (select count(*) from legacy.accommodations_raw)=(select count(*) from public.accommodations) as accommodations_match;
