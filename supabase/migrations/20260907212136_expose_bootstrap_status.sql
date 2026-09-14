create or replace function public.is_bootstrap_available()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select not exists (select 1 from public.profiles);
$function$;

grant execute on function public.is_bootstrap_available() to anon, authenticated;