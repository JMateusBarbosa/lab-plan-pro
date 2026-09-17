begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'exams' and cmd = 'SELECT' and 'authenticated' = any(roles)),
  1,
  'exams has exactly one authenticated SELECT policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exams'
      and policyname = 'exams_select_admin_or_own'
      and qual like '%deleted_at IS NULL%'
  ),
  'exam SELECT policy excludes soft-deleted rows'
);

select ok(
  not has_table_privilege('anon', 'public.exams', 'SELECT'),
  'anon cannot select exams directly'
);

select ok(
  not has_table_privilege('anon', 'public.laboratories', 'SELECT'),
  'anon cannot select laboratories directly'
);

select ok(
  has_table_privilege('authenticated', 'public.exams', 'SELECT'),
  'authenticated can select exams through RLS'
);

select ok(
  has_table_privilege('authenticated', 'public.exams', 'INSERT'),
  'authenticated can insert exams through RLS'
);

select ok(
  has_table_privilege('authenticated', 'public.exams', 'UPDATE'),
  'authenticated can update exams through RLS'
);

select ok(
  not has_table_privilege('authenticated', 'public.exams', 'DELETE'),
  'authenticated cannot physically delete exams'
);

select ok(
  not has_table_privilege('authenticated', 'public.laboratories', 'UPDATE'),
  'authenticated cannot directly update laboratories'
);

select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated cannot directly update profiles'
);

select ok(
  not has_table_privilege('authenticated', 'public.laboratory_schedules', 'UPDATE'),
  'authenticated cannot directly update laboratory schedules'
);

select ok(
  not has_function_privilege('authenticated', 'public.admin_update_laboratory_config(uuid,uuid,jsonb,jsonb)', 'EXECUTE'),
  'authenticated cannot call admin laboratory update RPC directly'
);

select ok(
  not has_function_privilege('authenticated', 'public.admin_set_laboratory_status(uuid,uuid,text)', 'EXECUTE'),
  'authenticated cannot call admin status RPC directly'
);

select ok(
  has_function_privilege('authenticated', 'public.soft_delete_exam(uuid)', 'EXECUTE'),
  'authenticated can call the controlled soft-delete RPC'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'exams'
      and indexname = 'idx_exams_deleted_by'
  ),
  'deleted_by foreign key has a covering index'
);

select ok(
  (select prosecdef from pg_proc where oid = 'public.soft_delete_exam(uuid)'::regprocedure),
  'soft-delete RPC is SECURITY DEFINER'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.list_audit_logs(integer,integer,text,text,uuid,uuid,timestamptz,timestamptz,text)',
    'EXECUTE'
  ),
  'authenticated can invoke the audit listing RPC and rely on RLS'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.list_audit_logs(integer,integer,text,text,uuid,uuid,timestamptz,timestamptz,text)',
    'EXECUTE'
  ),
  'anon cannot invoke the audit listing RPC'
);

select ok(
  not (select prosecdef from pg_proc where oid = 'public.list_audit_logs(integer,integer,text,text,uuid,uuid,timestamptz,timestamptz,text)'::regprocedure),
  'audit listing RPC is SECURITY INVOKER'
);

insert into auth.users (id, email, raw_app_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000101',
  'lab-one@test.local',
  '{"provisioned_by_admin":true}'::jsonb,
  now(),
  now()
);

insert into public.laboratories (id, name, school_name, city, state, status, computer_count)
values
  ('00000000-0000-0000-0000-000000000201', 'Lab One', 'School One', 'Test', 'AM', 'ativo', 2),
  ('00000000-0000-0000-0000-000000000202', 'Lab Two', 'School Two', 'Test', 'AM', 'ativo', 2);

insert into public.profiles (id, role, laboratory_id, email)
values (
  '00000000-0000-0000-0000-000000000101',
  'laboratory',
  '00000000-0000-0000-0000-000000000201',
  'lab-one@test.local'
);

insert into public.laboratory_schedules (laboratory_id, day_of_week, start_time, end_time, active)
values
  ('00000000-0000-0000-0000-000000000201', extract(dow from current_date)::integer, '10:00', '11:00', true),
  ('00000000-0000-0000-0000-000000000202', extract(dow from current_date)::integer, '10:00', '11:00', true);

insert into public.exams (
  id, laboratory_id, student_name, module, student_class_time, exam_date, pc_number, exam_type, status
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    'Student One', 'Module One', '10:00', current_date, 1, 'p1', 'pendente'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000202',
    'Student Two', 'Module Two', '10:00', current_date, 1, 'p1', 'pendente'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated"}',
  true
);

select public.soft_delete_exam('00000000-0000-0000-0000-000000000301');

select is(
  (select count(*)::integer from public.exams where id = '00000000-0000-0000-0000-000000000301'),
  0,
  'soft-deleted exam is hidden from its laboratory by RLS'
);

select throws_ok(
  $$select public.soft_delete_exam('00000000-0000-0000-0000-000000000302')$$,
  'P0001',
  'Você não possui permissão para excluir esta prova.',
  'laboratory cannot soft-delete an exam from another laboratory'
);

select is(
  (
    select count(*)::integer
    from public.list_audit_logs(1, 20, null, null, null, null, null, null, null)
  ),
  0,
  'laboratory cannot read audit logs through the audit RPC'
);

reset role;

select ok(
  exists (
    select 1
    from public.exams
    where id = '00000000-0000-0000-0000-000000000301'
      and deleted_at is not null
      and deleted_by = '00000000-0000-0000-0000-000000000101'
  ),
  'soft-deleted exam remains physically retained with actor attribution'
);

select * from finish();
rollback;
