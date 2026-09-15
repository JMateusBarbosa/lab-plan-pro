create unique index if not exists profiles_single_laboratory_account
on public.profiles (laboratory_id)
where role = 'laboratory' and laboratory_id is not null;
