import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

export type AuditFilters = {
  action?: string;
  entityType?: string;
  laboratoryId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
};

export type AuditLogRecord = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorRole: string | null;
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

export async function listAuditLogs(filters: AuditFilters): Promise<AuditLogPage> {
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("id, created_at, actor_user_id, actor_role, laboratory_id, action, entity_type, entity_id, before_data, after_data, metadata, laboratories(name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.laboratoryId) query = query.eq("laboratory_id", filters.laboratoryId);
  if (filters.startDate) query = query.gte("created_at", `${filters.startDate}T00:00:00-04:00`);
  if (filters.endDate) query = query.lte("created_at", `${filters.endDate}T23:59:59.999-04:00`);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    total: count ?? 0,
    records: (data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      actorUserId: row.actor_user_id,
      actorRole: row.actor_role,
      laboratoryId: row.laboratory_id,
      laboratoryName: row.laboratories?.name ?? null,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      beforeData: row.before_data,
      afterData: row.after_data,
      metadata: row.metadata,
    })),
  };
}
