-- Anonymous clients do not need direct access to application tables.
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.laboratories from anon;
revoke all privileges on table public.laboratory_schedules from anon;
revoke all privileges on table public.exams from anon;

-- Authenticated users receive only the operations used by the browser app.
revoke all privileges on table public.profiles from authenticated;
revoke all privileges on table public.laboratories from authenticated;
revoke all privileges on table public.laboratory_schedules from authenticated;
revoke all privileges on table public.exams from authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.laboratories to authenticated;
grant select on table public.laboratory_schedules to authenticated;
grant select, insert, update, delete on table public.exams to authenticated;

-- Trigger functions should not be callable directly by browser roles.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.validate_exam_schedule() from public, anon, authenticated;
revoke execute on function private.sync_profile_email_from_auth() from public, anon, authenticated, service_role;

-- Auth provisioning trigger remains available only to Supabase Auth internals.
revoke execute on function private.handle_new_auth_user() from public, anon, authenticated, service_role;
grant execute on function private.handle_new_auth_user() to supabase_auth_admin;

-- Harden SECURITY DEFINER RLS helpers against search-path shadowing.
create or replace function private.current_laboratory_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select p.laboratory_id
  from public.profiles p
  join public.laboratories l on l.id = p.laboratory_id
  where p.id = auth.uid()
    and p.role = 'laboratory'
    and l.status = 'ativo';
$function$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$function$;

revoke execute on function private.current_laboratory_id() from public, anon, service_role;
revoke execute on function private.is_admin() from public, anon, service_role;
grant execute on function private.current_laboratory_id() to authenticated;
grant execute on function private.is_admin() to authenticated;
