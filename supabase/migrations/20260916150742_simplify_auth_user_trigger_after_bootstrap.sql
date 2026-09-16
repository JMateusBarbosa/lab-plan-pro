create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_has_profiles boolean;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('is_laboratorios_auth_bootstrap')
  );

  select exists(select 1 from public.profiles)
  into v_has_profiles;

  if not v_has_profiles then
    insert into public.profiles (id, role, laboratory_id, email)
    values (new.id, 'admin', null, new.email);
  end if;

  return new;
end;
$function$;
