-- 11_bootstrap_admin.sql
-- Assigns the first administrator account.

begin;

do $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = lower('pradhanarush73@gmail.com')
  limit 1;

  if target_user_id is null then
    raise exception
      'No Supabase Auth user exists with that email';
  end if;

  insert into public.user_roles (
    user_id,
    role
  )
  values (
    target_user_id,
    'admin'::public.user_role
  )
  on conflict (user_id, role) do nothing;
end
$$;

commit;

select
  auth_users.email,
  array_agg(
    user_roles.role
    order by user_roles.role
  ) as roles
from auth.users auth_users
join public.user_roles user_roles
  on user_roles.user_id = auth_users.id
where lower(auth_users.email) =
  lower('pradhanarush73@gmail.com')
group by auth_users.email;