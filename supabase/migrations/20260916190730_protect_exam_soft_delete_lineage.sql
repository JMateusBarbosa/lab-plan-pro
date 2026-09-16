create or replace function public.soft_delete_exam(p_exam_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
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
