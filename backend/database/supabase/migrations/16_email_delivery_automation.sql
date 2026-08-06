-- Wellyura email-delivery automation.
--
-- Requirements:
-- 1. Supabase Cron integration is installed.
-- 2. pg_net is enabled.
-- 3. Vault contains:
--      wellyura_project_url
--      wellyura_automations_key
-- 4. send-alert-emails Edge Function is deployed.
--
-- Never place the actual secret key in this file.

create extension if not exists pg_net
with schema extensions;


-- Secure dispatcher called by Supabase Cron.
create or replace function
public.dispatch_wellyura_email_alerts()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  project_url text;
  automation_key text;
  request_id bigint;
begin
  -- Generate eligible deadline-reminder events.
  perform public.queue_deadline_reminder_events();

  -- Retrieve encrypted configuration from Vault.
  select decrypted_secret
  into project_url
  from vault.decrypted_secrets
  where name = 'wellyura_project_url';

  select decrypted_secret
  into automation_key
  from vault.decrypted_secrets
  where name = 'wellyura_automations_key';

  if project_url is null then
    raise exception
      'Vault secret wellyura_project_url is missing';
  end if;

  if automation_key is null then
    raise exception
      'Vault secret wellyura_automations_key is missing';
  end if;

  -- Invoke the email Edge Function asynchronously.
  select net.http_post(
    url :=
      rtrim(project_url, '/')
      || '/functions/v1/send-alert-emails',

    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'apikey',
      automation_key
    ),

    body := jsonb_build_object(
      'batch_size',
      100
    )
  )
  into request_id;

  return request_id;
end;
$$;


revoke all
on function public.dispatch_wellyura_email_alerts()
from public, anon, authenticated;

grant execute
on function public.dispatch_wellyura_email_alerts()
to service_role;


-- Remove an existing copy before recreating the schedule.
select cron.unschedule(jobid)
from cron.job
where jobname = 'wellyura-email-alerts-daily';


-- Run every day at 08:00 UTC / 13:30 IST.
select cron.schedule(
  'wellyura-email-alerts-daily',
  '0 8 * * *',
  $cron$
    select public.dispatch_wellyura_email_alerts();
  $cron$
);