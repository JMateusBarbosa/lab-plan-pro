create or replace function private.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email
    where id = new.id;
  end if;

  return new;
end;
$function$;

drop trigger if exists on_auth_user_email_updated
on auth.users;

create trigger on_auth_user_email_updated
after update of email
on auth.users
for each row
execute function private.sync_profile_email_from_auth();