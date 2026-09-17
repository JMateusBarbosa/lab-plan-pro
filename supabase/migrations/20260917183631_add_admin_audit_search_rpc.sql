create or replace function public.list_audit_logs(
  p_page integer default 1,
  p_page_size integer default 20,
  p_action text default null,
  p_entity_type text default null,
  p_laboratory_id uuid default null,
  p_actor_user_id uuid default null,
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_search text default null
)
returns table (
  id uuid,
  created_at timestamptz,
  actor_user_id uuid,
  actor_role text,
  actor_email text,
  laboratory_id uuid,
  laboratory_name text,
  action text,
  entity_type text,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    a.id,
    a.created_at,
    a.actor_user_id,
    a.actor_role,
    p.email as actor_email,
    a.laboratory_id,
    l.name as laboratory_name,
    a.action,
    a.entity_type,
    a.entity_id,
    a.before_data,
    a.after_data,
    a.metadata,
    count(*) over() as total_count
  from public.audit_logs a
  left join public.profiles p on p.id = a.actor_user_id
  left join public.laboratories l on l.id = a.laboratory_id
  where (p_action is null or a.action = p_action)
    and (p_entity_type is null or a.entity_type = p_entity_type)
    and (p_laboratory_id is null or a.laboratory_id = p_laboratory_id)
    and (p_actor_user_id is null or a.actor_user_id = p_actor_user_id)
    and (p_start_at is null or a.created_at >= p_start_at)
    and (p_end_at is null or a.created_at <= p_end_at)
    and (
      nullif(btrim(p_search), '') is null
      or a.action ilike '%' || btrim(p_search) || '%'
      or a.entity_type ilike '%' || btrim(p_search) || '%'
      or coalesce(a.entity_id::text, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(a.actor_user_id::text, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(p.email, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(l.name, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(a.before_data::text, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(a.after_data::text, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(a.metadata::text, '') ilike '%' || btrim(p_search) || '%'
    )
  order by a.created_at desc
  limit greatest(1, least(coalesce(p_page_size, 20), 100))
  offset (greatest(coalesce(p_page, 1), 1) - 1) * greatest(1, least(coalesce(p_page_size, 20), 100));
$function$;

revoke all on function public.list_audit_logs(integer, integer, text, text, uuid, uuid, timestamptz, timestamptz, text) from public, anon;
grant execute on function public.list_audit_logs(integer, integer, text, text, uuid, uuid, timestamptz, timestamptz, text) to authenticated;
