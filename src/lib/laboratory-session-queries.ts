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

  return {
    async clearSession() {
      await signOutLaboratory();
      queryClient.removeQueries({ queryKey: laboratorySessionKey });
    },
    async refreshSession() {
      await queryClient.invalidateQueries({ queryKey: laboratorySessionKey });
    },
  };
}
