import { useQuery } from "@tanstack/react-query";
import { getAuditFilterOptions, listAuditLogs } from "@/lib/admin-audit-api";
import type { AuditFilters } from "@/types/audit";

const adminAuditKey = ["admin", "audit"] as const;

export function useAdminAuditQuery(filters: AuditFilters) {
  return useQuery({
    queryKey: [...adminAuditKey, "list", filters],
    queryFn: () => listAuditLogs(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminAuditFilterOptionsQuery() {
  return useQuery({
    queryKey: [...adminAuditKey, "filters"],
    queryFn: getAuditFilterOptions,
    staleTime: 60_000,
  });
}
