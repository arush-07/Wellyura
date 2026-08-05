-- Read-only safety check. Run this first in the NEW Supabase project.
-- It confirms that the old Wellyura application tables are not present here.

select
  current_database() as database_name,
  current_user as connected_role,
  now() as checked_at;

select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

select
  not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('programs', 'users', 'favorites')
  ) as safe_new_project;
