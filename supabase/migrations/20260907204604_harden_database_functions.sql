create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.validate_exam_schedule()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_computer_count integer;
  v_previous_lab uuid;
  v_day smallint;
begin
  select computer_count into v_computer_count
  from public.laboratories
  where id = new.laboratory_id;

  if v_computer_count is null then
    raise exception 'Laboratório não encontrado.';
  end if;

  if new.pc_number > v_computer_count then
    raise exception 'PC % não existe neste laboratório. Limite atual: %.', new.pc_number, v_computer_count;
  end if;

  v_day := extract(dow from new.exam_date)::smallint;

  if not exists (
    select 1
    from public.laboratory_schedules ls
    where ls.laboratory_id = new.laboratory_id
      and ls.day_of_week = v_day
      and ls.start_time = new.student_class_time
      and ls.active = true
  ) then
    raise exception 'Não existe horário ativo para este laboratório, dia e horário de aula.';
  end if;

  if new.previous_exam_id is not null then
    select laboratory_id into v_previous_lab
    from public.exams
    where id = new.previous_exam_id;

    if v_previous_lab is null then
      raise exception 'Prova anterior não encontrada.';
    end if;

    if v_previous_lab <> new.laboratory_id then
      raise exception 'A prova anterior pertence a outro laboratório.';
    end if;

    if new.exam_type <> 'recuperacao' then
      raise exception 'Uma prova vinculada a tentativa anterior deve ser do tipo recuperação.';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_laboratories_updated_at on public.laboratories;
create trigger set_laboratories_updated_at
before update on public.laboratories
for each row execute function public.set_updated_at();

drop trigger if exists set_laboratory_schedules_updated_at on public.laboratory_schedules;
create trigger set_laboratory_schedules_updated_at
before update on public.laboratory_schedules
for each row execute function public.set_updated_at();

drop trigger if exists set_exams_updated_at on public.exams;
create trigger set_exams_updated_at
before update on public.exams
for each row execute function public.set_updated_at();

drop trigger if exists validate_exam_schedule_on_insert on public.exams;
create trigger validate_exam_schedule_on_insert
before insert on public.exams
for each row execute function public.validate_exam_schedule();

drop trigger if exists validate_exam_schedule_on_schedule_change on public.exams;
create trigger validate_exam_schedule_on_schedule_change
before update of laboratory_id, exam_date, student_class_time, pc_number, previous_exam_id, exam_type
on public.exams
for each row execute function public.validate_exam_schedule();