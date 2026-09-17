import { supabase } from "@/lib/supabase";
import type { AuditFilterOptions, AuditFilters, AuditListResult, AuditLogItem } from "@/types/audit";

const AUDIT_ACTIONS = [
  "insert",
  "update",
  "soft_delete",
  "restore",
  "admin_update",
  "status_change",
  "provision",
] as const;

const AUDIT_ENTITY_TYPES = ["exam", "laboratory"] as const;
const BUSINESS_UTC_OFFSET = "-04:00";

function startOfDayIso(date: string) {
  return `${date}T00:00:00.000${BUSINESS_UTC_OFFSET}`;
}

function endOfDayIso(date: string) {
  return `${date}T23:59:59.999${BUSINESS_UTC_OFFSET}`;
}

export async function listAuditLogs(filters: AuditFilters): Promise<AuditListResult> {
  const fromIndex = (filters.page - 1) * filters.pageSize;
  const toIndex = fromIndex + filters.pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(fromIndex, toIndex);

  if (filters.from) query = query.gte("created_at", startOfDayIso(filters.from));
  if (filters.to) query = query.lte("created_at", endOfDayIso(filters.to));
  if (filters.laboratoryId) query = query.eq("laboratory_id", filters.laboratoryId);
  if (filters.actorUserId) query = query.eq("actor_user_id", filters.actorUserId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);

  const { data: logs, error, count } = await query;
  if (error) throw error;

  const actorIds = Array.from(
    new Set((logs ?? []).map((log) => log.actor_user_id).filter((id): id is string => Boolean(id))),
  );
  const laboratoryIds = Array.from(
    new Set((logs ?? []).map((log) => log.laboratory_id).filter((id): id is string => Boolean(id))),
  );

  const [actorsResult, laboratoriesResult] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select("id, email, role").in("id", actorIds)
      : Promise.resolve({ data: [], error: null }),
    laboratoryIds.length
      ? supabase.from("laboratories").select("id, name").in("id", laboratoryIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (actorsResult.error) throw actorsResult.error;
  if (laboratoriesResult.error) throw laboratoriesResult.error;

  const actorById = new Map((actorsResult.data ?? []).map((actor) => [actor.id, actor]));
  const laboratoryById = new Map(
    (laboratoriesResult.data ?? []).map((laboratory) => [laboratory.id, laboratory.name]),
  );

  const items: AuditLogItem[] = (logs ?? []).map((log) => ({
    id: log.id,
    actorUserId: log.actor_user_id,
    actorRole: log.actor_role,
    actorEmail: log.actor_user_id ? actorById.get(log.actor_user_id)?.email ?? null : null,
    laboratoryId: log.laboratory_id,
    laboratoryName: log.laboratory_id ? laboratoryById.get(log.laboratory_id) ?? null : null,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    beforeData: log.before_data,
    afterData: log.after_data,
    metadata: log.metadata,
    createdAt: log.created_at,
  }));

  const total = count ?? 0;
  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getAuditFilterOptions(): Promise<AuditFilterOptions> {
  const [laboratoriesResult, actorsResult] = await Promise.all([
    supabase.from("laboratories").select("id, name").order("name"),
    supabase.from("profiles").select("id, email, role").order("email"),
  ]);

  if (laboratoriesResult.error) throw laboratoriesResult.error;
  if (actorsResult.error) throw actorsResult.error;

  return {
    laboratories: laboratoriesResult.data ?? [],
    actors: actorsResult.data ?? [],
    actions: [...AUDIT_ACTIONS],
    entityTypes: [...AUDIT_ENTITY_TYPES],
  };
}
