import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLaboratorySession, signOutLaboratory } from "@/lib/laboratory-session-api";

export const laboratoryQueryRootKey = ["laboratory"] as const;
export const laboratorySessionKey = [...laboratoryQueryRootKey, "session"] as const;

export function useLaboratorySessionQuery() {
  return useQuery({
    queryKey: laboratorySessionKey,
    queryFn: getLaboratorySession,
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });
}

export function useLaboratorySessionActions() {
  const queryClient = useQueryClient();

  const clearSession = useCallback(async () => {
    try {
      await signOutLaboratory();
    } finally {
      queryClient.removeQueries({ queryKey: laboratoryQueryRootKey });
    }
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: laboratorySessionKey });
  }, [queryClient]);

  return { clearSession, refreshSession };
}
