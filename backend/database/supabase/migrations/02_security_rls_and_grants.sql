-- Explicit Data API grants and Row Level Security
-- Required because automatic table exposure was disabled for the new project.

begin;

create or replace function public.has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.can_manage_catalogue()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin') or public.has_role('publisher') or public.has_role('editor');
$$;

revoke all on function public.has_role(public.user_role) from public, anon;
revoke all on function public.can_manage_catalogue() from public, anon;
grant execute on function public.has_role(public.user_role) to authenticated, service_role;
grant execute on function public.can_manage_catalogue() to authenticated, service_role;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Public catalogue read access
grant select on table
  public.countries,
  public.cities,
  public.institution_types,
  public.universities,
  public.campuses,
  public.university_contacts,
  public.university_intakes,
  public.university_deadlines,
  public.university_eligibility,
  public.university_scholarships,
  public.university_insights,
  public.degree_levels,
  public.programmes,
  public.programme_fees,
  public.programme_requirements,
  public.programme_required_subjects,
  public.programme_career_roles,
  public.programme_features,
  public.accommodations,
  public.accommodation_room_types,
  public.amenities,
  public.accommodation_amenities,
  public.accommodation_images,
  public.accommodation_universities
  to anon, authenticated;

-- Signed-in user workspace access
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.university_favorites to authenticated;
grant select, insert, delete on public.search_history to authenticated;
grant select, insert, update on public.housing_inquiries to authenticated;
grant select, insert, update, delete on public.accommodation_reviews to authenticated;
grant insert on public.contact_messages to anon, authenticated;

grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to anon;

-- Backend/service key retains complete access
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Enable RLS on every public table
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname='public'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

-- Published catalogue policies
do $$
declare t text;
begin
  foreach t in array array['countries','cities'] loop
    execute format('drop policy if exists public_read_published on public.%I', t);
    execute format('create policy public_read_published on public.%I for select to anon, authenticated using (publication_status = ''published'')', t);
    execute format('drop policy if exists catalogue_manage on public.%I', t);
    execute format('create policy catalogue_manage on public.%I for all to authenticated using (public.can_manage_catalogue()) with check (public.can_manage_catalogue())', t);
  end loop;

  foreach t in array array['universities','programmes','accommodations'] loop
    execute format('drop policy if exists public_read_published on public.%I', t);
    execute format('create policy public_read_published on public.%I for select to anon, authenticated using (publication_status = ''published'')', t);
    execute format('drop policy if exists catalogue_manage on public.%I', t);
    execute format('create policy catalogue_manage on public.%I for all to authenticated using (public.can_manage_catalogue()) with check (public.can_manage_catalogue())', t);
  end loop;
end $$;

-- Make the remainder of this script safe to run again.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and policyname in (
        'institution_types_public_read','degree_levels_public_read','amenities_public_read',
        'campuses_public_read','university_contacts_public_read','university_intakes_public_read',
        'university_deadlines_public_read','university_eligibility_public_read',
        'university_scholarships_public_read','university_insights_public_read',
        'programme_fees_public_read','programme_requirements_public_read','programme_subjects_public_read',
        'programme_roles_public_read','programme_features_public_read','accommodation_rooms_public_read',
        'accommodation_amenities_public_read','accommodation_images_public_read',
        'accommodation_universities_public_read','profiles_select_own','profiles_update_own',
        'roles_select_own','roles_admin_manage','favorites_own','search_history_own',
        'housing_inquiries_own','housing_inquiries_insert_own','housing_inquiries_update_own',
        'reviews_public_read','reviews_insert_own','reviews_update_own','reviews_delete_own',
        'contact_insert_public','contact_admin_read','contact_admin_update'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

-- Child catalogue tables are readable only when their parent is published
create policy institution_types_public_read on public.institution_types for select to anon, authenticated using (true);
create policy degree_levels_public_read on public.degree_levels for select to anon, authenticated using (true);
create policy amenities_public_read on public.amenities for select to anon, authenticated using (true);

create policy campuses_public_read on public.campuses for select to anon, authenticated
using (exists(select 1 from public.universities u where u.id=university_id and u.publication_status='published'));
create policy university_contacts_public_read on public.university_contacts for select to anon, authenticated
using (exists(select 1 from public.universities u where u.id=university_id and u.publication_status='published'));
create policy university_intakes_public_read on public.university_intakes for select to anon, authenticated
using (exists(select 1 from public.universities u where u.id=university_id and u.publication_status='published'));
create policy university_deadlines_public_read on public.university_deadlines for select to anon, authenticated
using (exists(select 1 from public.universities u where u.id=university_id and u.publication_status='published'));
create policy university_eligibility_public_read on public.university_eligibility for select to anon, authenticated
using (exists(select 1 from public.universities u where u.id=university_id and u.publication_status='published'));
create policy university_scholarships_public_read on public.university_scholarships for select to anon, authenticated
using (exists(select 1 from public.universities u where u.id=university_id and u.publication_status='published'));
create policy university_insights_public_read on public.university_insights for select to anon, authenticated
using (exists(select 1 from public.universities u where u.id=university_id and u.publication_status='published'));

create policy programme_fees_public_read on public.programme_fees for select to anon, authenticated
using (exists(select 1 from public.programmes p where p.id=programme_id and p.publication_status='published'));
create policy programme_requirements_public_read on public.programme_requirements for select to anon, authenticated
using (exists(select 1 from public.programmes p where p.id=programme_id and p.publication_status='published'));
create policy programme_subjects_public_read on public.programme_required_subjects for select to anon, authenticated
using (exists(select 1 from public.programmes p where p.id=programme_id and p.publication_status='published'));
create policy programme_roles_public_read on public.programme_career_roles for select to anon, authenticated
using (exists(select 1 from public.programmes p where p.id=programme_id and p.publication_status='published'));
create policy programme_features_public_read on public.programme_features for select to anon, authenticated
using (exists(select 1 from public.programmes p where p.id=programme_id and p.publication_status='published'));

create policy accommodation_rooms_public_read on public.accommodation_room_types for select to anon, authenticated
using (exists(select 1 from public.accommodations a where a.id=accommodation_id and a.publication_status='published'));
create policy accommodation_amenities_public_read on public.accommodation_amenities for select to anon, authenticated
using (exists(select 1 from public.accommodations a where a.id=accommodation_id and a.publication_status='published'));
create policy accommodation_images_public_read on public.accommodation_images for select to anon, authenticated
using (exists(select 1 from public.accommodations a where a.id=accommodation_id and a.publication_status='published'));
create policy accommodation_universities_public_read on public.accommodation_universities for select to anon, authenticated
using (exists(select 1 from public.accommodations a where a.id=accommodation_id and a.publication_status='published'));

-- Catalogue management on child tables
do $$
declare t text;
begin
  foreach t in array array[
    'institution_types','campuses','university_contacts','university_intakes','university_deadlines',
    'university_eligibility','university_scholarships','university_insights','degree_levels',
    'programme_fees','programme_requirements','programme_required_subjects','programme_career_roles',
    'programme_features','amenities','accommodation_room_types','accommodation_amenities',
    'accommodation_images','accommodation_universities'
  ] loop
    execute format('drop policy if exists catalogue_manage on public.%I', t);
    execute format('create policy catalogue_manage on public.%I for all to authenticated using (public.can_manage_catalogue()) with check (public.can_manage_catalogue())', t);
  end loop;
end $$;

-- User-owned data
create policy profiles_select_own on public.profiles for select to authenticated using (id=auth.uid() or public.has_role('admin'));
create policy profiles_update_own on public.profiles for update to authenticated using (id=auth.uid() or public.has_role('admin')) with check (id=auth.uid() or public.has_role('admin'));
create policy roles_select_own on public.user_roles for select to authenticated using (user_id=auth.uid() or public.has_role('admin'));
create policy roles_admin_manage on public.user_roles for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy favorites_own on public.university_favorites for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy search_history_own on public.search_history for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy housing_inquiries_own on public.housing_inquiries for select to authenticated using (user_id=auth.uid() or public.has_role('admin'));
create policy housing_inquiries_insert_own on public.housing_inquiries for insert to authenticated with check (user_id=auth.uid());
create policy housing_inquiries_update_own on public.housing_inquiries for update to authenticated using (user_id=auth.uid() or public.has_role('admin')) with check (user_id=auth.uid() or public.has_role('admin'));
create policy reviews_public_read on public.accommodation_reviews for select to anon, authenticated using (true);
create policy reviews_insert_own on public.accommodation_reviews for insert to authenticated with check (user_id=auth.uid());
create policy reviews_update_own on public.accommodation_reviews for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy reviews_delete_own on public.accommodation_reviews for delete to authenticated using (user_id=auth.uid() or public.has_role('admin'));
create policy contact_insert_public on public.contact_messages for insert to anon, authenticated with check (true);
create policy contact_admin_read on public.contact_messages for select to authenticated using (public.has_role('admin'));
create policy contact_admin_update on public.contact_messages for update to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

commit;
