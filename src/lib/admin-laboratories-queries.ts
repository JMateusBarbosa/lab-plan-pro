import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminDashboardData,
  getAdminLaboratory,
  listAdminLaboratories,
  provisionLaboratory,
  resetLaboratoryAccessPassword,
  toggleLaboratoryStatus,
  updateLaboratory,
  updateLaboratoryAccessEmail,
} from "@/lib/admin-laboratories-api";
import type { LaboratoryFormValues, LaboratoryAccessFormValues } from "@/types/laboratory";
import type { LaboratoryScheduleInput } from "@/types/laboratory-schedule";

const adminLaboratoriesKey = ["admin", "laboratories"] as const;
const adminDashboardKey = ["admin", "dashboard"] as const;

export function useAdminLaboratoriesQuery() {
  return useQuery({
    queryKey: adminLaboratoriesKey,
    queryFn: listAdminLaboratories,
  });
}

export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKey,
    queryFn: getAdminDashboardData,
  });
}

export function useAdminLaboratoryQuery(id: string) {
  return useQuery({
    queryKey: [...adminLaboratoriesKey, id],
    queryFn: () => getAdminLaboratory(id),
    enabled: Boolean(id),
  });
}

export function useProvisionLaboratoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      access,
      schedules,
    }: {
      values: LaboratoryFormValues;
      access: LaboratoryAccessFormValues;
      schedules: LaboratoryScheduleInput[];
    }) => provisionLaboratory(values, access, schedules),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminLaboratoriesKey }),
        queryClient.invalidateQueries({ queryKey: adminDashboardKey }),
      ]);
    },
  });
}

export function useUpdateLaboratoryMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      schedules,
    }: {
      values: LaboratoryFormValues;
      schedules: LaboratoryScheduleInput[];
    }) => updateLaboratory(id, values, schedules),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminLaboratoriesKey }),
        queryClient.invalidateQueries({ queryKey: [...adminLaboratoriesKey, id] }),
        queryClient.invalidateQueries({ queryKey: adminDashboardKey }),
      ]);
    },
  });
}

export function useToggleLaboratoryStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: "ativo" | "inativo" }) =>
      toggleLaboratoryStatus(id, currentStatus),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminLaboratoriesKey }),
        queryClient.invalidateQueries({ queryKey: [...adminLaboratoriesKey, variables.id] }),
        queryClient.invalidateQueries({ queryKey: adminDashboardKey }),
      ]);
    },
  });
}


export function useUpdateLaboratoryAccessEmailMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => updateLaboratoryAccessEmail(id, email),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminLaboratoriesKey }),
        queryClient.invalidateQueries({ queryKey: [...adminLaboratoriesKey, id] }),
        queryClient.invalidateQueries({ queryKey: adminDashboardKey }),
        queryClient.invalidateQueries({ queryKey: ["admin", "audit"] }),
      ]);
    },
  });
}

export function useResetLaboratoryAccessPasswordMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => resetLaboratoryAccessPassword(id, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
}
