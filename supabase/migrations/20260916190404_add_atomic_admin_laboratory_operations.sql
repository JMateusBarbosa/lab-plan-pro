create or replace function public.admin_update_laboratory_config(
  p_actor_user_id uuid,
  p_laboratory_id uuid,
  p_laboratory jsonb,
  p_schedules jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_old_lab public.laboratories%rowtype;
  v_new_computer_count integer;
  v_new_status text;
  v_today date := (now() at time zone 'America/Manaus')::date;
  v_exam record;
  v_schedule jsonb;
  v_day integer;
  v_start time;
  v_end time;
  v_active boolean;
begin
  select * into v_old_lab
  from public.laboratories
  where id = p_laboratory_id
  for update;

  if not found then
    raise exception 'Laboratório não encontrado.';
  end if;

  if jsonb_typeof(p_schedules) <> 'array' or jsonb_array_length(p_schedules) = 0 then
    raise exception 'Cadastre pelo menos um horário.';
  end if;

  v_new_computer_count := (p_laboratory->>'computerCount')::integer;
  v_new_status := p_laboratory->>'status';

  if v_new_computer_count < 1 then
    raise exception 'Quantidade de computadores inválida.';
  end if;

  if v_new_status not in ('ativo', 'inativo') then
    raise exception 'Status do laboratório inválido.';
  end if;

  create temporary table if not exists pg_temp.requested_schedules (
    day_of_week integer not null,
    start_time time not null,
    end_time time not null,
    active boolean not null
  ) on commit drop;
  truncate pg_temp.requested_schedules;

  for v_schedule in select value from jsonb_array_elements(p_schedules)
  loop
    v_day := (v_schedule->>'dayOfWeek')::integer;
    v_start := (v_schedule->>'startTime')::time;
    v_end := (v_schedule->>'endTime')::time;
    v_active := coalesce((v_schedule->>'active')::boolean, true);

    if v_day < 0 or v_day > 6 then
      raise exception 'Há um dia da semana inválido.';
    end if;
    if v_end <= v_start then
      raise exception 'Há um horário inválido.';
    end if;

    if exists (
      select 1 from pg_temp.requested_schedules
      where day_of_week = v_day and start_time = v_start
    ) then
      raise exception 'Há horários duplicados.';
    end if;

    insert into pg_temp.requested_schedules(day_of_week, start_time, end_time, active)
    values (v_day, v_start, v_end, v_active);
  end loop;

  for v_exam in
    select exam_date, pc_number, student_class_time
    from public.exams
    where laboratory_id = p_laboratory_id
      and deleted_at is null
      and exam_date >= v_today
  loop
    if v_exam.pc_number > v_new_computer_count then
      raise exception 'A quantidade de computadores não pode ser reduzida porque existem provas de hoje ou futuras agendadas em PCs acima do novo limite.';
    end if;

    if not exists (
      select 1
      from pg_temp.requested_schedules s
      where s.active = true
        and s.day_of_week = extract(dow from v_exam.exam_date)::integer
        and s.start_time = v_exam.student_class_time
    ) then
      raise exception 'Os horários não podem ser alterados dessa forma porque existem provas de hoje ou futuras usando um horário que seria removido ou desativado.';
    end if;
  end loop;

  update public.laboratories
  set name = trim(p_laboratory->>'name'),
      school_name = trim(p_laboratory->>'schoolName'),
      responsible = nullif(trim(coalesce(p_laboratory->>'responsible', '')), ''),
      phone = nullif(trim(coalesce(p_laboratory->>'phone', '')), ''),
      city = trim(p_laboratory->>'city'),
      state = trim(p_laboratory->>'state'),
      status = v_new_status,
      computer_count = v_new_computer_count
  where id = p_laboratory_id;

  delete from public.laboratory_schedules
  where laboratory_id = p_laboratory_id;

  insert into public.laboratory_schedules (
    laboratory_id, day_of_week, start_time, end_time, active
  )
  select p_laboratory_id, day_of_week, start_time, end_time, active
  from pg_temp.requested_schedules;

  insert into public.audit_logs (
    actor_user_id, actor_role, laboratory_id, action, entity_type, entity_id, before_data, after_data
  )
  select
    p_actor_user_id,
    'admin',
    p_laboratory_id,
    'admin_update',
    'laboratory',
    p_laboratory_id,
    to_jsonb(v_old_lab),
    to_jsonb(l)
  from public.laboratories l
  where l.id = p_laboratory_id;
end;
$function$;

revoke all on function public.admin_update_laboratory_config(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.admin_update_laboratory_config(uuid, uuid, jsonb, jsonb) to service_role;

create or replace function public.admin_set_laboratory_status(
  p_actor_user_id uuid,
  p_laboratory_id uuid,
  p_status text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_old_lab public.laboratories%rowtype;
begin
  if p_status not in ('ativo', 'inativo') then
    raise exception 'Status do laboratório inválido.';
  end if;

  select * into v_old_lab
  from public.laboratories
  where id = p_laboratory_id
  for update;

  if not found then
    raise exception 'Laboratório não encontrado.';
  end if;

  update public.laboratories
  set status = p_status
  where id = p_laboratory_id;

  insert into public.audit_logs (
    actor_user_id, actor_role, laboratory_id, action, entity_type, entity_id, before_data, after_data
  )
  select
    p_actor_user_id,
    'admin',
    p_laboratory_id,
    'status_change',
    'laboratory',
    p_laboratory_id,
    to_jsonb(v_old_lab),
    to_jsonb(l)
  from public.laboratories l
  where l.id = p_laboratory_id;
end;
$function$;

revoke all on function public.admin_set_laboratory_status(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_laboratory_status(uuid, uuid, text) to service_role;
