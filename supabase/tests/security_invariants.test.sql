begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

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

select * from finish();
rollback;
