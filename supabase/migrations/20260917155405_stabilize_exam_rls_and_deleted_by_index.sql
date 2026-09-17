drop policy if exists exams_admin_or_own_select on public.exams;

create index if not exists idx_exams_deleted_by
  on public.exams (deleted_by)
  where deleted_by is not null;

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
      or (
        deleted_at is not null
        and deleted_by = (select auth.uid())
      )
    )
  );
