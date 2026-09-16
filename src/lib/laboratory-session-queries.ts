import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLaboratorySession, signOutLaboratory } from "@/lib/laboratory-session-api";

export const laboratorySessionKey = ["laboratory", "session"] as const;

export function useLaboratorySessionQuery() {
  return useQuery({
    queryKey: laboratorySessionKey,
    queryFn: getLaboratorySession,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLaboratorySessionActions() {
  const queryClient = useQueryClient();

  const clearSession = useCallback(async () => {
    await signOutLaboratory();
    queryClient.removeQueries({ queryKey: laboratorySessionKey });
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: laboratorySessionKey });
  }, [queryClient]);

  return { clearSession, refreshSession };
}
