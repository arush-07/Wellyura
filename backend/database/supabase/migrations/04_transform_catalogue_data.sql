-- Transform imported legacy catalogue data into the normalized public schema.
-- Run only after all seven CSV files have been imported into the legacy schema.

begin;

-- Return an empty array for blank, invalid, or object-shaped legacy JSON.
-- This prevents jsonb_array_elements* from failing on fields that were empty
-- in the legacy CSV exports and were therefore parsed as {}.
create or replace function internal.safe_jsonb_array(value text)
returns jsonb
language plpgsql
immutable
set search_path = public, internal
as $$
declare
  parsed jsonb;
begin
  parsed := internal.safe_jsonb(value);
  if jsonb_typeof(parsed) = 'array' then
    return parsed;
  end if;
  return '[]'::jsonb;
end;
$$;

insert into internal.import_batches(label, source_project_ref, status)
values('Existing Wellyura Supabase CSV migration', 'apdwopkkcfiddvqalpwe', 'running');

-- Reference data -------------------------------------------------------------
insert into public.countries(name, slug, iso2, iso3, region, currency_code)
values
  ('United States','united-states','US','USA','North America','USD'),
  ('United Kingdom','united-kingdom','GB','GBR','Europe','GBP'),
  ('Australia','australia','AU','AUS','Oceania','AUD'),
  ('Canada','canada','CA','CAN','North America','CAD'),
  ('Germany','germany','DE','DEU','Europe','EUR'),
  ('France','france','FR','FRA','Europe','EUR'),
  ('Netherlands','netherlands','NL','NLD','Europe','EUR'),
  ('South Korea','south-korea','KR','KOR','Asia','KRW'),
  ('Singapore','singapore','SG','SGP','Asia','SGD'),
  ('Russia','russia','RU','RUS','Europe and Asia','RUB'),
  ('Ireland','ireland','IE','IRL','Europe','EUR'),
  ('New Zealand','new-zealand','NZ','NZL','Oceania','NZD')
on conflict(name) do update set
  iso2=excluded.iso2, iso3=excluded.iso3, region=excluded.region, currency_code=excluded.currency_code;

insert into public.institution_types(name, slug)
select distinct initcap(coalesce(nullif(btrim(type),''),'University')), internal.slugify(coalesce(nullif(btrim(type),''),'University'))
from legacy.universities_raw
on conflict(name) do nothing;

insert into public.degree_levels(code, name, sort_order)
values ('UG','Undergraduate',10), ('PG','Postgraduate',20)
on conflict(code) do update set name=excluded.name, sort_order=excluded.sort_order;

-- Cities from primary university and accommodation locations ----------------
with source_locations as (
  select country, city, coalesce(province,'') province from legacy.universities_raw
  union
  select country, city, coalesce(province,'') province from legacy.accommodations_raw
), mapped as (
  select
    case btrim(country)
      when 'USA' then 'United States'
      when 'UK' then 'United Kingdom'
      else btrim(country)
    end country_name,
    btrim(city) city_name,
    btrim(province) province_name
  from source_locations
  where nullif(btrim(city),'') is not null and nullif(btrim(country),'') is not null
)
insert into public.cities(country_id, name, province, slug)
select c.id, m.city_name, coalesce(m.province_name,''), internal.slugify(m.city_name)
from mapped m join public.countries c on c.name=m.country_name
on conflict do nothing;

-- Additional city names stored in campus arrays ------------------------------
with campus_values as (
  select r.country, r.province, jsonb_array_elements_text(internal.safe_jsonb_array(r.campuses)) campus_name
  from legacy.universities_raw r
  where jsonb_typeof(internal.safe_jsonb_array(r.campuses))='array'
), mapped as (
  select
    case btrim(country) when 'USA' then 'United States' when 'UK' then 'United Kingdom' else btrim(country) end country_name,
    btrim(campus_name) city_name,
    coalesce(btrim(province),'') province_name
  from campus_values
  where nullif(btrim(campus_name),'') is not null
)
insert into public.cities(country_id, name, province, slug)
select c.id, m.city_name, m.province_name, internal.slugify(m.city_name)
from mapped m join public.countries c on c.name=m.country_name
on conflict do nothing;

-- Universities ---------------------------------------------------------------
insert into public.universities(
  legacy_id, institution_type_id, country_id, primary_city_id, name, slug, abbreviation,
  website, application_portal, application_fee, publication_status, verification_status,
  published_at, legacy_payload
)
select
  r.id,
  it.id,
  c.id,
  city.id,
  btrim(r.name),
  coalesce(nullif(internal.slugify(r.slug),''), internal.slugify(r.name) || '-' || left(md5(r.id),8)),
  nullif(btrim(r.abbreviation),''),
  nullif(btrim(r.website),''),
  nullif(btrim(r.application_portal),''),
  (internal.numeric_range(r.application_fee))[1],
  'published',
  'legacy_import',
  now(),
  to_jsonb(r)
from legacy.universities_raw r
join public.countries c on c.name = case btrim(r.country) when 'USA' then 'United States' when 'UK' then 'United Kingdom' else btrim(r.country) end
left join public.cities city on city.country_id=c.id and city.slug=internal.slugify(r.city) and city.province=coalesce(btrim(r.province),'')
left join public.institution_types it on it.slug=internal.slugify(coalesce(nullif(btrim(r.type),''),'University'))
on conflict(legacy_id) do update set
  name=excluded.name,
  country_id=excluded.country_id,
  primary_city_id=excluded.primary_city_id,
  legacy_payload=excluded.legacy_payload,
  updated_at=now();

-- Primary and additional campuses -------------------------------------------
insert into public.campuses(university_id, city_id, name, slug, address, is_primary, legacy_payload)
select u.id, u.primary_city_id, coalesce(city.name,u.name || ' Main Campus'),
       internal.slugify(coalesce(city.name,'main-campus')),
       nullif(internal.safe_jsonb(r.contacts)->'admissions'->>'address',''),
       true,
       jsonb_build_object('source','primary_city')
from public.universities u
left join public.cities city on city.id=u.primary_city_id
left join legacy.universities_raw r on r.id=u.legacy_id
on conflict(university_id,slug) do update set
  city_id=excluded.city_id,
  name=excluded.name,
  address=excluded.address,
  is_primary=true,
  legacy_payload=excluded.legacy_payload,
  updated_at=now();

with campus_values as (
  select r.id legacy_id, r.country, r.province,
         jsonb_array_elements_text(internal.safe_jsonb_array(r.campuses)) campus_name
  from legacy.universities_raw r
  where jsonb_typeof(internal.safe_jsonb_array(r.campuses))='array'
)
insert into public.campuses(university_id, city_id, name, slug, is_primary, legacy_payload)
select u.id, city.id, btrim(cv.campus_name), internal.slugify(cv.campus_name),
       city.id=u.primary_city_id, jsonb_build_object('source','campuses_array')
from campus_values cv
join public.universities u on u.legacy_id=cv.legacy_id
join public.countries c on c.id=u.country_id
left join public.cities city on city.country_id=c.id and city.slug=internal.slugify(cv.campus_name) and city.province=coalesce(btrim(cv.province),'')
where nullif(btrim(cv.campus_name),'') is not null
on conflict(university_id,slug) do nothing;

-- University contacts, intakes, deadlines and metadata ----------------------
with contact_values as (
  select u.id university_id, entry.key contact_type, entry.value details
  from legacy.universities_raw r
  join public.universities u on u.legacy_id=r.id
  cross join lateral jsonb_each(internal.safe_jsonb(r.contacts)) entry
  where jsonb_typeof(entry.value)='object'
)
insert into public.university_contacts(university_id, contact_type, email, phone, address, details)
select university_id, contact_type, nullif(details->>'email',''), nullif(details->>'phone',''), nullif(details->>'address',''), details
from contact_values
where details <> '{}'::jsonb
on conflict(university_id,contact_type) do update set details=excluded.details, email=excluded.email, phone=excluded.phone, address=excluded.address;

with intake_values as (
  select u.id university_id, value intake_label, ordinality-1 sort_order
  from legacy.universities_raw r
  join public.universities u on u.legacy_id=r.id
  cross join lateral jsonb_array_elements_text(internal.safe_jsonb_array(r.intakes)) with ordinality as x(value, ordinality)
)
insert into public.university_intakes(university_id,label,sort_order)
select university_id, intake_label, sort_order from intake_values
where nullif(btrim(intake_label),'') is not null
on conflict(university_id,label) do update set sort_order=excluded.sort_order;

with deadline_values as (
  select u.id university_id, entry.key label, entry.value details
  from legacy.universities_raw r
  join public.universities u on u.legacy_id=r.id
  cross join lateral jsonb_each(internal.safe_jsonb(r.deadlines)) entry
)
insert into public.university_deadlines(university_id,label,deadline_text,details)
select university_id,label,
       case when jsonb_typeof(details)='string' then trim(both '"' from details::text) else details->>'deadline' end,
       case when jsonb_typeof(details)='object' then details else jsonb_build_object('value',details) end
from deadline_values;

insert into public.university_eligibility(university_id,undergraduate,postgraduate,raw_data)
select u.id,
       coalesce(internal.safe_jsonb(r.eligibility)->'undergraduate','{}'::jsonb),
       coalesce(internal.safe_jsonb(r.eligibility)->'postgraduate','{}'::jsonb),
       internal.safe_jsonb(r.eligibility)
from legacy.universities_raw r join public.universities u on u.legacy_id=r.id
on conflict(university_id) do update set undergraduate=excluded.undergraduate, postgraduate=excluded.postgraduate, raw_data=excluded.raw_data, updated_at=now();

with scholarship_values as (
  select u.id university_id, elem value, ordinality-1 sort_order
  from legacy.universities_raw r
  join public.universities u on u.legacy_id=r.id
  cross join lateral jsonb_array_elements(internal.safe_jsonb_array(r.scholarships)) with ordinality as x(elem, ordinality)
  where jsonb_typeof(internal.safe_jsonb_array(r.scholarships))='array'
)
insert into public.university_scholarships(university_id,name,details,sort_order)
select university_id,
       coalesce(nullif(value->>'name',''), value::text),
       case when jsonb_typeof(value)='object' then value else jsonb_build_object('value',value) end,
       sort_order
from scholarship_values
where coalesce(nullif(value->>'name',''), value::text) is not null;

insert into public.university_insights(university_id,internships,campus_life,security,top_ug_programs,top_pg_programs)
select u.id, internal.safe_jsonb(r.internships), internal.safe_jsonb(r.campus_life), internal.safe_jsonb(r.security),
       internal.safe_jsonb(r.top_ug_programs), internal.safe_jsonb(r.top_pg_programs)
from legacy.universities_raw r join public.universities u on u.legacy_id=r.id
on conflict(university_id) do update set internships=excluded.internships,campus_life=excluded.campus_life,security=excluded.security,
  top_ug_programs=excluded.top_ug_programs,top_pg_programs=excluded.top_pg_programs,updated_at=now();

-- Programmes ----------------------------------------------------------------
insert into public.programmes(
  legacy_id, university_id, degree_level_id, name, slug, faculty,
  duration_min_months, duration_max_months, duration_text,
  publication_status, verification_status, legacy_payload
)
select
  r.id,
  u.id,
  dl.id,
  btrim(r.name),
  internal.slugify(r.name) || '-' || left(md5(r.id),8),
  nullif(btrim(r.faculty),''),
  case when duration_values[1] is null then null else greatest(1,round(duration_values[1]*12)::int) end,
  case when duration_values[2] is null then null else greatest(1,round(duration_values[2]*12)::int) end,
  nullif(btrim(r.duration_years),''),
  'published','legacy_import',to_jsonb(r)
from legacy.programmes_raw r
join public.universities u on u.legacy_id=r.institution_id
left join public.degree_levels dl on dl.code=upper(btrim(r.level))
cross join lateral internal.numeric_range(r.duration_years) duration_values
on conflict(legacy_id) do update set
  university_id=excluded.university_id, name=excluded.name, faculty=excluded.faculty,
  duration_min_months=excluded.duration_min_months, duration_max_months=excluded.duration_max_months,
  duration_text=excluded.duration_text, legacy_payload=excluded.legacy_payload, updated_at=now();

insert into public.programme_fees(programme_id,fee_type,amount_min,amount_max,currency_code,period,raw_value)
select p.id, fee_type,
       (internal.numeric_range(raw_value))[1], (internal.numeric_range(raw_value))[2],
       'CAD', case fee_type when 'annual' then 'academic_year' else 'programme' end, raw_value
from legacy.programmes_raw r
join public.programmes p on p.legacy_id=r.id
cross join lateral (values ('annual',r.annual_fee_cad),('total',r.total_fee_cad)) fee(fee_type,raw_value)
where nullif(btrim(raw_value),'') is not null
on conflict(programme_id,fee_type) do update set amount_min=excluded.amount_min,amount_max=excluded.amount_max,raw_value=excluded.raw_value;

insert into public.programme_requirements(programme_id,requirement_type,minimum_value,maximum_value,raw_value)
select p.id,'class_12_percentage',(internal.numeric_range(r.min_class12_percent))[1],(internal.numeric_range(r.min_class12_percent))[2],r.min_class12_percent
from legacy.programmes_raw r join public.programmes p on p.legacy_id=r.id
where nullif(btrim(r.min_class12_percent),'') is not null;

with subject_values as (
  select p.id programme_id, value subject, ordinality-1 sort_order
  from legacy.programmes_raw r join public.programmes p on p.legacy_id=r.id
  cross join lateral jsonb_array_elements_text(internal.safe_jsonb_array(r.required_subjects)) with ordinality x(value,ordinality)
)
insert into public.programme_required_subjects(programme_id,subject,sort_order)
select programme_id,subject,sort_order from subject_values where nullif(btrim(subject),'') is not null
on conflict(programme_id,subject) do nothing;

with role_values as (
  select p.id programme_id, value role_name, ordinality-1 sort_order
  from legacy.programmes_raw r join public.programmes p on p.legacy_id=r.id
  cross join lateral jsonb_array_elements_text(internal.safe_jsonb_array(r.entry_roles)) with ordinality x(value,ordinality)
)
insert into public.programme_career_roles(programme_id,role_name,sort_order)
select programme_id,role_name,sort_order from role_values where nullif(btrim(role_name),'') is not null
on conflict(programme_id,role_name) do nothing;

with feature_values as (
  select p.id programme_id, value feature, ordinality-1 sort_order
  from legacy.programmes_raw r join public.programmes p on p.legacy_id=r.id
  cross join lateral jsonb_array_elements_text(internal.safe_jsonb_array(r.features)) with ordinality x(value,ordinality)
)
insert into public.programme_features(programme_id,feature,sort_order)
select programme_id,feature,sort_order from feature_values where nullif(btrim(feature),'') is not null
on conflict(programme_id,feature) do nothing;

-- Accommodation --------------------------------------------------------------
insert into public.accommodations(
  legacy_id,city_id,name,slug,property_type,gender_policy,address,base_price_monthly,
  currency_code,rating,reviews_count,description,contact_email,rules,
  publication_status,verification_status,legacy_payload
)
select r.id,city.id,btrim(r.name),coalesce(nullif(internal.slugify(r.slug),''),internal.slugify(r.name)||'-'||left(md5(r.id),8)),
       nullif(btrim(r.type),''),nullif(btrim(r.gender_policy),''),nullif(btrim(r.address),''),
       (internal.numeric_range(r.price_per_month_cad))[1],'CAD',
       (internal.numeric_range(r.rating))[1],coalesce((internal.numeric_range(r.reviews_count))[1]::int,0),
       nullif(r.description,''),nullif(btrim(r.contact_email),''),internal.safe_jsonb(r.rules),
       'published','legacy_import',to_jsonb(r)
from legacy.accommodations_raw r
join public.countries c on c.name=case btrim(r.country) when 'USA' then 'United States' when 'UK' then 'United Kingdom' else btrim(r.country) end
left join public.cities city on city.country_id=c.id and city.slug=internal.slugify(r.city) and city.province=coalesce(btrim(r.province),'')
on conflict(legacy_id) do update set name=excluded.name,city_id=excluded.city_id,legacy_payload=excluded.legacy_payload,updated_at=now();

with room_values as (
  select a.id accommodation_id, elem room, ordinality-1 sort_order
  from legacy.accommodations_raw r join public.accommodations a on a.legacy_id=r.id
  cross join lateral jsonb_array_elements(internal.safe_jsonb_array(r.room_types)) with ordinality x(elem,ordinality)
  where jsonb_typeof(internal.safe_jsonb_array(r.room_types))='array'
)
insert into public.accommodation_room_types(accommodation_id,name,price_per_month,available_rooms,amenities)
select accommodation_id,coalesce(nullif(room->>'name',''),'Room'),
       (internal.numeric_range(room->>'price_per_month'))[1],
       (internal.numeric_range(room->>'available_rooms'))[1]::int,
       coalesce(room->'amenities','[]'::jsonb)
from room_values
on conflict(accommodation_id,name) do update set price_per_month=excluded.price_per_month,available_rooms=excluded.available_rooms,amenities=excluded.amenities;

with amenity_values as (
  select a.id accommodation_id,value amenity
  from legacy.accommodations_raw r join public.accommodations a on a.legacy_id=r.id
  cross join lateral jsonb_array_elements_text(internal.safe_jsonb_array(r.amenities)) x(value)
)
insert into public.amenities(name,slug)
select distinct amenity,internal.slugify(amenity) from amenity_values where nullif(btrim(amenity),'') is not null
on conflict(name) do nothing;

with amenity_values as (
  select a.id accommodation_id,value amenity
  from legacy.accommodations_raw r join public.accommodations a on a.legacy_id=r.id
  cross join lateral jsonb_array_elements_text(internal.safe_jsonb_array(r.amenities)) x(value)
)
insert into public.accommodation_amenities(accommodation_id,amenity_id)
select av.accommodation_id,am.id from amenity_values av join public.amenities am on am.name=av.amenity
on conflict do nothing;

with image_values as (
  select a.id accommodation_id,value image_path,ordinality-1 sort_order
  from legacy.accommodations_raw r join public.accommodations a on a.legacy_id=r.id
  cross join lateral jsonb_array_elements_text(internal.safe_jsonb_array(r.images)) with ordinality x(value,ordinality)
)
insert into public.accommodation_images(accommodation_id,path,alt_text,sort_order)
select accommodation_id,image_path,'Accommodation image',sort_order from image_values
where nullif(btrim(image_path),'') is not null
on conflict(accommodation_id,path) do update set sort_order=excluded.sort_order;

with nearby_values as (
  select a.id accommodation_id,elem nearby
  from legacy.accommodations_raw r join public.accommodations a on a.legacy_id=r.id
  cross join lateral jsonb_array_elements(internal.safe_jsonb_array(r.nearby_universities)) x(elem)
  where jsonb_typeof(internal.safe_jsonb_array(r.nearby_universities))='array'
)
insert into public.accommodation_universities(
  accommodation_id,university_id,legacy_institution_id,legacy_institution_name,distance_km,commute_mode,commute_time_mins
)
select nv.accommodation_id,u.id,nv.nearby->>'institution_id',nv.nearby->>'institution_name',
       (internal.numeric_range(nv.nearby->>'distance_km'))[1],nv.nearby->>'commute_mode',
       (internal.numeric_range(nv.nearby->>'commute_time_mins'))[1]::int
from nearby_values nv
left join public.universities u on u.legacy_id=nv.nearby->>'institution_id';

-- Existing contact messages --------------------------------------------------
insert into public.contact_messages(legacy_id,name,email,subject,message,created_at)
select id,nullif(name,''),nullif(email,''),nullif(subject,''),coalesce(message,''),
       case when nullif(btrim(created_at),'') is null then now() else created_at::timestamptz end
from legacy.contact_messages_raw
on conflict(legacy_id) do update set name=excluded.name,email=excluded.email,subject=excluded.subject,message=excluded.message;

-- Record conversion issues without losing raw source values -----------------
insert into internal.import_issues(entity_type,legacy_id,field_name,raw_value,issue)
select 'programme',r.id,'duration_years',r.duration_years,'Could not convert duration into numeric months; raw value remains in programmes.duration_text and legacy_payload.'
from legacy.programmes_raw r
where nullif(btrim(r.duration_years),'') is not null and (internal.numeric_range(r.duration_years))[1] is null;

insert into internal.import_issues(entity_type,legacy_id,field_name,raw_value,issue)
select 'programme',r.id,'annual_fee_cad',r.annual_fee_cad,'Could not convert annual fee into a numeric range; raw value remains in programme_fees.raw_value and legacy_payload.'
from legacy.programmes_raw r
where nullif(btrim(r.annual_fee_cad),'') is not null and (internal.numeric_range(r.annual_fee_cad))[1] is null;

update internal.import_batches
set completed_at=now(), status='catalogue_transformed'
where id=(select id from internal.import_batches order by started_at desc limit 1);

commit;