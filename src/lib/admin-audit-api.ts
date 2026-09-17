import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

export type AuditFilters = {
  action?: string;
  entityType?: string;
  laboratoryId?: string;
  actorUserId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  pageSize: number;
};

export type AuditLogRecord = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorRole: string | null;
  actorEmail: string | null;
  laboratoryId: string | null;
  laboratoryName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: Json | null;
  afterData: Json | null;
  metadata: Json;
};

export type AuditLogPage = {
  records: AuditLogRecord[];
  total: number;
};

export type AuditActor = {
  id: string;
  email: string;
  role: string;
};

type AuditRpcRow = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_role: string | null;
  actor_email: string | null;
  laboratory_id: string | null;
  laboratory_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Json | null;
  after_data: Json | null;
  metadata: Json;
  total_count: number | string;
};

type AuditRpcClient = {
  rpc: (
    name: "list_audit_logs",
    params: {
      p_page: number;
      p_page_size: number;
      p_action: string | null;
      p_entity_type: string | null;
      p_laboratory_id: string | null;
      p_actor_user_id: string | null;
      p_start_at: string | null;
      p_end_at: string | null;
      p_search: string | null;
    },
  ) => Promise<{ data: AuditRpcRow[] | null; error: { message: string } | null }>;
};

function toStartAt(date?: string) {
  return date ? `${date}T00:00:00-04:00` : null;
}

function toEndAt(date?: string) {
  return date ? `${date}T23:59:59.999-04:00` : null;
}

function mapAuditRow(row: AuditRpcRow): AuditLogRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    actorEmail: row.actor_email,
    laboratoryId: row.laboratory_id,
    laboratoryName: row.laboratory_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    beforeData: row.before_data,
    afterData: row.after_data,
    metadata: row.metadata,
  };
}

export async function listAuditLogs(filters: AuditFilters): Promise<AuditLogPage> {
  const rpcClient = supabase as unknown as AuditRpcClient;
  const { data, error } = await rpcClient.rpc("list_audit_logs", {
    p_page: filters.page,
    p_page_size: filters.pageSize,
    p_action: filters.action ?? null,
    p_entity_type: filters.entityType ?? null,
    p_laboratory_id: filters.laboratoryId ?? null,
    p_actor_user_id: filters.actorUserId ?? null,
    p_start_at: toStartAt(filters.startDate),
    p_end_at: toEndAt(filters.endDate),
    p_search: filters.search?.trim() || null,
  });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    records: rows.map(mapAuditRow),
  };
}

export async function listAuditActors(): Promise<AuditActor[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .order("email", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listAllFilteredAuditLogs(filters: Omit<AuditFilters, "page" | "pageSize">) {
  const records: AuditLogRecord[] = [];
  const pageSize = 100;
  let page = 1;
  let total = 0;

  do {
    const result = await listAuditLogs({ ...filters, page, pageSize });
    total = result.total;
    records.push(...result.records);
    page += 1;
  } while (records.length < total && records.length < 5000);

  return {
    records,
    total,
    truncated: records.length < total,
  };
}
