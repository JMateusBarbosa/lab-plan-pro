import { useQuery } from "@tanstack/react-query";
import { listAdminLaboratories } from "@/lib/admin-laboratories-api";
import {
  listAuditActors,
  listAuditLogs,
  type AuditFilters,
} from "@/lib/admin-audit-api";

export const adminAuditKeys = {
  all: ["admin", "audit"] as const,
  list: (filters: AuditFilters) => ["admin", "audit", "list", filters] as const,
  laboratories: ["admin", "audit", "laboratories"] as const,
  actors: ["admin", "audit", "actors"] as const,
};

export function useAdminAuditQuery(filters: AuditFilters) {
  return useQuery({
    queryKey: adminAuditKeys.list(filters),
    queryFn: () => listAuditLogs(filters),
    staleTime: 15_000,
  });
}

export function useAdminAuditLaboratoriesQuery() {
  return useQuery({
    queryKey: adminAuditKeys.laboratories,
    queryFn: listAdminLaboratories,
    staleTime: 60_000,
  });
}

export function useAdminAuditActorsQuery() {
  return useQuery({
    queryKey: adminAuditKeys.actors,
    queryFn: listAuditActors,
    staleTime: 60_000,
  });
}
