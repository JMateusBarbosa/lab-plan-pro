create table if not exists public.admin_operation_requests (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'processing',
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_operation_requests_status_check check (status in ('processing','completed','failed')),
  constraint admin_operation_requests_operation_check check (operation in ('provision_laboratory')),
  constraint admin_operation_requests_unique unique (actor_user_id, operation, idempotency_key)
);

create index if not exists idx_admin_operation_requests_created_at
  on public.admin_operation_requests (created_at desc);

alter table public.admin_operation_requests enable row level security;
revoke all privileges on table public.admin_operation_requests from public, anon, authenticated;
grant select, insert, update on table public.admin_operation_requests to service_role;

create trigger set_admin_operation_requests_updated_at
before update on public.admin_operation_requests
for each row execute function public.set_updated_at();
