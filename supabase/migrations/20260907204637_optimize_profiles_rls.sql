create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$function$;

create or replace function private.current_laboratory_id()
returns uuid
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select laboratory_id
  from public.profiles
  where id = auth.uid()
    and role = 'laboratory';
$function$;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or private.is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert
on public.profiles
for insert
to authenticated
with check (private.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
on public.profiles
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete
on public.profiles
for delete
to authenticated
using (private.is_admin());

drop policy if exists laboratories_select_admin_or_own on public.laboratories;
create policy laboratories_select_admin_or_own
on public.laboratories
for select
to authenticated
using (private.is_admin() or id = private.current_laboratory_id());

drop policy if exists laboratories_admin_insert on public.laboratories;
create policy laboratories_admin_insert
on public.laboratories
for insert
to authenticated
with check (private.is_admin());

drop policy if exists laboratories_admin_update on public.laboratories;
create policy laboratories_admin_update
on public.laboratories
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists laboratories_admin_delete on public.laboratories;
create policy laboratories_admin_delete
on public.laboratories
for delete
to authenticated
using (private.is_admin());

drop policy if exists schedules_select_admin_or_own on public.laboratory_schedules;
create policy schedules_select_admin_or_own
on public.laboratory_schedules
for select
to authenticated
using (private.is_admin() or laboratory_id = private.current_laboratory_id());

drop policy if exists schedules_admin_insert on public.laboratory_schedules;
create policy schedules_admin_insert
on public.laboratory_schedules
for insert
to authenticated
with check (private.is_admin());

drop policy if exists schedules_admin_update on public.laboratory_schedules;
create policy schedules_admin_update
on public.laboratory_schedules
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists schedules_admin_delete on public.laboratory_schedules;
create policy schedules_admin_delete
on public.laboratory_schedules
for delete
to authenticated
using (private.is_admin());

drop policy if exists exams_admin_or_own_select on public.exams;
create policy exams_admin_or_own_select
on public.exams
for select
to authenticated
using (private.is_admin() or laboratory_id = private.current_laboratory_id());

drop policy if exists exams_laboratory_insert on public.exams;
create policy exams_laboratory_insert
on public.exams
for insert
to authenticated
with check (
  laboratory_id = private.current_laboratory_id()
  and not private.is_admin()
);

drop policy if exists exams_laboratory_update on public.exams;
create policy exams_laboratory_update
on public.exams
for update
to authenticated
using (
  laboratory_id = private.current_laboratory_id()
  and not private.is_admin()
)
with check (
  laboratory_id = private.current_laboratory_id()
  and not private.is_admin()
);

drop policy if exists exams_laboratory_delete on public.exams;
create policy exams_laboratory_delete
on public.exams
for delete
to authenticated
using (
  laboratory_id = private.current_laboratory_id()
  and not private.is_admin()
);