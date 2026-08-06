-- 15_announcement_notification_fix.sql
-- Map platform announcement categories to supported
-- notification-event categories.

begin;

create or replace function
public.create_announcement_notification_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_type text;
begin
  if new.is_published = true
     and (
       tg_op = 'INSERT'
       or old.is_published is distinct from true
     )
  then
    notification_type :=
      case
        when new.announcement_type in (
          'scholarship',
          'programme'
        )
        then new.announcement_type

        else 'system'
      end;

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
      notification_type,
      new.title,
      new.message,
      new.link_url,
      new.id,
      coalesce(
        new.publish_at,
        now()
      ),
      'pending'
    );
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

commit;

select
  to_regprocedure(
    'public.create_announcement_notification_event()'
  ) as announcement_notification_trigger_function,

  exists (
    select 1
    from pg_trigger
    where tgname =
      'create_announcement_notification_event_trigger'
      and not tgisinternal
  ) as trigger_created;