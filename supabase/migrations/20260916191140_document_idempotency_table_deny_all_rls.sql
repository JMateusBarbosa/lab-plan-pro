comment on table public.admin_operation_requests is
  'Server-only idempotency ledger. RLS intentionally has no client policies; only service_role has table grants.';
