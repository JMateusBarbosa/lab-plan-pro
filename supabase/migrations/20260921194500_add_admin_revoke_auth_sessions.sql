create or replace function public.admin_revoke_auth_sessions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_deleted integer := 0;
begin
  if p_user_id is null then
    raise exception 'Usuário inválido.';
  end if;

  delete from auth.sessions
  where user_id = p_user_id;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

revoke all on function public.admin_revoke_auth_sessions(uuid) from public, anon, authenticated;
grant execute on function public.admin_revoke_auth_sessions(uuid) to service_role;
