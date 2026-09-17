import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminSession, signOutAdmin } from "@/lib/admin-session-api";

export const adminQueryRootKey = ["admin"] as const;
export const adminSessionKey = [...adminQueryRootKey, "session"] as const;

export function useAdminSessionQuery() {
  return useQuery({
    queryKey: adminSessionKey,
    queryFn: getAdminSession,
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
}

export function useAdminSessionActions() {
  const queryClient = useQueryClient();

  const clearSession = useCallback(async () => {
    try {
      await signOutAdmin();
    } finally {
      queryClient.removeQueries({ queryKey: adminQueryRootKey });
    }
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: adminSessionKey });
  }, [queryClient]);

  return { clearSession, refreshSession };
}
