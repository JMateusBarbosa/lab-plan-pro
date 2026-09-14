alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

alter table public.profiles alter column email set not null;

create unique index if not exists profiles_email_unique_ci
  on public.profiles (lower(email));

create or replace function private.current_laboratory_id()
returns uuid
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select p.laboratory_id
  from public.profiles p
  join public.laboratories l on l.id = p.laboratory_id
  where p.id = auth.uid()
    and p.role = 'laboratory'
    and l.status = 'ativo';
$function$;

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
    insert into public.profiles (id, role, laboratory_id, email)
    values (new.id, 'admin', null, new.email);

    return new;
  end if;

  if coalesce(
    new.raw_app_meta_data->>'provisioned_by_admin',
    'false'
  ) <> 'true' then
    raise exception
      'Cadastro público desabilitado. Novos usuários devem ser criados por um administrador.';
  end if;

  v_role := new.raw_app_meta_data->>'profile_role';

  if v_role not in ('admin', 'laboratory') then
    raise exception 'Papel de usuário inválido.';
  end if;

  if v_role = 'laboratory' then
    v_laboratory_id :=
      nullif(
        new.raw_app_meta_data->>'laboratory_id',
        ''
      )::uuid;

    if v_laboratory_id is null then
      raise exception
        'Usuário de laboratório precisa de laboratory_id.';
    end if;
  else
    v_laboratory_id := null;
  end if;

  insert into public.profiles (
    id,
    role,
    laboratory_id,
    email
  )
  values (
    new.id,
    v_role,
    v_laboratory_id,
    new.email
  );

  return new;
end;
$function$;

drop policy if exists laboratories_admin_delete
on public.laboratories;

drop policy if exists profiles_admin_delete
on public.profiles;

alter table public.exams
  drop constraint if exists exams_previous_exam_id_fkey;

alter table public.exams
  add constraint exams_previous_exam_id_fkey
  foreign key (previous_exam_id)
  references public.exams(id)
  on delete restrict;

create unique index if not exists exams_single_recovery_child
  on public.exams (previous_exam_id)
  where previous_exam_id is not null;

create or replace function public.validate_exam_schedule()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_computer_count integer;
  v_previous_lab uuid;
  v_previous_status text;
  v_previous_student_name text;
  v_previous_module text;
  v_day smallint;
  v_cursor uuid;
begin
  select computer_count
  into v_computer_count
  from public.laboratories
  where id = new.laboratory_id;

  if v_computer_count is null then
    raise exception 'Laboratório não encontrado.';
  end if;

  if new.pc_number > v_computer_count then
    raise exception
      'PC % não existe neste laboratório. Limite atual: %.',
      new.pc_number,
      v_computer_count;
  end if;

  v_day :=
    extract(dow from new.exam_date)::smallint;

  if not exists (
    select 1
    from public.laboratory_schedules ls
    where ls.laboratory_id = new.laboratory_id
      and ls.day_of_week = v_day
      and ls.start_time = new.student_class_time
      and ls.active = true
  ) then
    raise exception
      'Não existe horário ativo para este laboratório, dia e horário de aula.';
  end if;

  if new.exam_type = 'p1'
     and new.previous_exam_id is not null then
    raise exception
      'Uma P1 não pode possuir prova anterior.';
  end if;

  if new.exam_type = 'recuperacao'
     and new.previous_exam_id is null then
    raise exception
      'Uma recuperação precisa estar vinculada a uma tentativa anterior.';
  end if;

  if new.previous_exam_id is not null then
    select
      laboratory_id,
      status,
      student_name,
      module
    into
      v_previous_lab,
      v_previous_status,
      v_previous_student_name,
      v_previous_module
    from public.exams
    where id = new.previous_exam_id;

    if v_previous_lab is null then
      raise exception
        'Prova anterior não encontrada.';
    end if;

    if v_previous_lab <> new.laboratory_id then
      raise exception
        'A prova anterior pertence a outro laboratório.';
    end if;

    if v_previous_status <> 'reprovado' then
      raise exception
        'A prova anterior precisa estar reprovada para originar uma recuperação.';
    end if;

    if v_previous_student_name <> new.student_name
       or v_previous_module <> new.module then
      raise exception
        'A recuperação deve manter o mesmo aluno e módulo da tentativa anterior.';
    end if;

    v_cursor := new.previous_exam_id;

    while v_cursor is not null loop
      if v_cursor = new.id then
        raise exception
          'A prova anterior selecionada criaria um ciclo no histórico de recuperações.';
      end if;

      select previous_exam_id
      into v_cursor
      from public.exams
      where id = v_cursor;
    end loop;
  end if;

  if tg_op = 'UPDATE'
     and exists (
       select 1
       from public.exams child
       where child.previous_exam_id = new.id
         and (
           new.status <> 'reprovado'
           or child.student_name <> new.student_name
           or child.module <> new.module
           or child.laboratory_id <> new.laboratory_id
         )
     ) then
    raise exception
      'Esta prova já possui uma recuperação vinculada e não pode quebrar a cadeia histórica.';
  end if;

  return new;
end;
$function$;

drop trigger if exists
  validate_exam_schedule_on_schedule_change
on public.exams;

create trigger validate_exam_schedule_on_schedule_change
before update of
  laboratory_id,
  student_name,
  module,
  exam_date,
  student_class_time,
  pc_number,
  previous_exam_id,
  exam_type,
  status
on public.exams
for each row
execute function public.validate_exam_schedule();