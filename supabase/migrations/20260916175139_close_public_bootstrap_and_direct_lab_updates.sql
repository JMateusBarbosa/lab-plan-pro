create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if coalesce(
    new.raw_app_meta_data->>'provisioned_by_admin',
    'false'
  ) <> 'true' then
    raise exception
      'Cadastro público desabilitado. Usuários devem ser provisionados por um fluxo administrativo autorizado.';
  end if;

  return new;
end;
$function$;

drop function if exists public.is_bootstrap_available();

drop policy if exists laboratories_admin_update on public.laboratories;

revoke update on table public.laboratories from anon;
revoke update on table public.laboratories from authenticated;
