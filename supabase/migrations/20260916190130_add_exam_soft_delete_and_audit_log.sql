alter table public.exams
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists idx_exams_active_laboratory_date
  on public.exams (laboratory_id, exam_date)
  where deleted_at is null;

alter table public.exams drop constraint if exists exams_unique_pc_slot;
drop index if exists public.exams_unique_pc_slot;
create unique index exams_unique_pc_slot
  on public.exams (laboratory_id, exam_date, student_class_time, pc_number)
  where deleted_at is null;

drop index if exists public.exams_single_recovery_child;
create unique index exams_single_recovery_child
  on public.exams (previous_exam_id)
  where previous_exam_id is not null and deleted_at is null;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  laboratory_id uuid references public.laboratories(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_check check (action in ('insert','update','soft_delete','restore','admin_update','status_change','provision'))
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_user_id, created_at desc);
create index if not exists idx_audit_logs_laboratory on public.audit_logs (laboratory_id, created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id, created_at desc);

alter table public.audit_logs enable row level security;
revoke all privileges on table public.audit_logs from anon, authenticated;
grant select, insert on table public.audit_logs to service_role;

create policy audit_logs_admin_select
  on public.audit_logs
  for select
  to authenticated
  using (private.is_admin());

grant select on table public.audit_logs to authenticated;

create or replace function private.audit_exam_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_action text;
begin
  if v_actor is not null then
    select role into v_role
    from public.profiles
    where id = v_actor;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'insert';
    insert into public.audit_logs (
      actor_user_id, actor_role, laboratory_id, action, entity_type, entity_id, after_data
    ) values (
      v_actor, v_role, new.laboratory_id, v_action, 'exam', new.id, to_jsonb(new)
    );
    return new;
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    v_action := 'soft_delete';
  elsif old.deleted_at is not null and new.deleted_at is null then
    v_action := 'restore';
  else
    v_action := 'update';
  end if;

  insert into public.audit_logs (
    actor_user_id, actor_role, laboratory_id, action, entity_type, entity_id, before_data, after_data
  ) values (
    v_actor, v_role, new.laboratory_id, v_action, 'exam', new.id, to_jsonb(old), to_jsonb(new)
  );

  return new;
end;
$function$;

revoke execute on function private.audit_exam_changes() from public, anon, authenticated, service_role;

create or replace function public.soft_delete_exam(p_exam_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.exams
  set deleted_at = now(),
      deleted_by = auth.uid()
  where id = p_exam_id
    and deleted_at is null;

  if not found then
    raise exception 'Prova não encontrada ou já excluída.';
  end if;
end;
$function$;

revoke all on function public.soft_delete_exam(uuid) from public, anon;
grant execute on function public.soft_delete_exam(uuid) to authenticated;

drop trigger if exists audit_exam_changes on public.exams;
create trigger audit_exam_changes
  after insert or update on public.exams
  for each row execute function private.audit_exam_changes();

drop policy if exists exams_select_admin_or_own on public.exams;
drop policy if exists exams_laboratory_select on public.exams;
create policy exams_select_admin_or_own
  on public.exams
  for select
  to authenticated
  using (
    deleted_at is null
    and (
      private.is_admin()
      or laboratory_id = private.current_laboratory_id()
    )
  );

drop policy if exists exams_laboratory_insert on public.exams;
create policy exams_laboratory_insert
  on public.exams
  for insert
  to authenticated
  with check (
    deleted_at is null
    and deleted_by is null
    and laboratory_id = private.current_laboratory_id()
  );

drop policy if exists exams_laboratory_update on public.exams;
create policy exams_laboratory_update
  on public.exams
  for update
  to authenticated
  using (
    deleted_at is null
    and laboratory_id = private.current_laboratory_id()
  )
  with check (
    laboratory_id = private.current_laboratory_id()
    and (
      deleted_at is null
      or (deleted_at is not null and deleted_by = auth.uid())
    )
  );

drop policy if exists exams_laboratory_delete on public.exams;

revoke delete on table public.exams from authenticated;

grant select, insert, update on table public.exams to authenticated;
