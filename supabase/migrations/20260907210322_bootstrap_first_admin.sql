create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_has_profiles boolean;
  v_role text;
  v_laboratory_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('is_laboratorios_auth_bootstrap')
  );

  select exists(select 1 from public.profiles)
  into v_has_profiles;

  if not v_has_profiles then
    insert into public.profiles (id, role, laboratory_id)
    values (new.id, 'admin', null);
    return new;
  end if;

  if coalesce(new.raw_app_meta_data->>'provisioned_by_admin', 'false') <> 'true' then
    raise exception 'Cadastro público desabilitado. Novos usuários devem ser criados por um administrador.';
  end if;

  v_role := new.raw_app_meta_data->>'profile_role';

  if v_role not in ('admin', 'laboratory') then
    raise exception 'Papel de usuário inválido.';
  end if;

  if v_role = 'laboratory' then
    v_laboratory_id := nullif(new.raw_app_meta_data->>'laboratory_id', '')::uuid;
    if v_laboratory_id is null then
      raise exception 'Usuário de laboratório precisa de laboratory_id.';
    end if;
  else
    v_laboratory_id := null;
  end if;

  insert into public.profiles (id, role, laboratory_id)
  values (new.id, v_role, v_laboratory_id);

  return new;
end;
$function$;

-- The production project also has the following trigger on auth.users:
-- on_auth_user_created AFTER INSERT -> private.handle_new_auth_user().
-- Keep this trigger when initializing a new Supabase project.