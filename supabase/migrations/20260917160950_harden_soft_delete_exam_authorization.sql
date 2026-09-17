create or replace function public.soft_delete_exam(p_exam_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_actor_laboratory_id uuid;
  v_exam_laboratory_id uuid;
begin
  if v_actor is null then
    raise exception 'Sessão inválida.';
  end if;

  select p.laboratory_id
    into v_actor_laboratory_id
  from public.profiles p
  join public.laboratories l on l.id = p.laboratory_id
  where p.id = v_actor
    and p.role = 'laboratory'
    and l.status = 'ativo';

  if v_actor_laboratory_id is null then
    raise exception 'Esta conta não possui acesso a um laboratório ativo.';
  end if;

  select e.laboratory_id
    into v_exam_laboratory_id
  from public.exams e
  where e.id = p_exam_id
    and e.deleted_at is null
  for update;

  if not found then
    raise exception 'Prova não encontrada ou já excluída.';
  end if;

  if v_exam_laboratory_id <> v_actor_laboratory_id then
    raise exception 'Você não possui permissão para excluir esta prova.';
  end if;

  if exists (
    select 1
    from public.exams child
    where child.previous_exam_id = p_exam_id
      and child.deleted_at is null
  ) then
    raise exception 'Esta prova possui uma recuperação vinculada e não pode ser excluída antes dela.';
  end if;

  update public.exams
  set deleted_at = now(),
      deleted_by = v_actor
  where id = p_exam_id;
end;
$function$;

revoke all on function public.soft_delete_exam(uuid) from public, anon, authenticated;
grant execute on function public.soft_delete_exam(uuid) to authenticated;
