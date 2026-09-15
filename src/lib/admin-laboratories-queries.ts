import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminLaboratory,
  listAdminLaboratories,
  provisionLaboratory,
  toggleLaboratoryStatus,
} from "@/lib/admin-laboratories-api";
import { supabase } from "@/lib/supabase";
import type { LaboratoryFormValues, LaboratoryAccessFormValues } from "@/types/laboratory";
import type { LaboratoryScheduleInput } from "@/types/laboratory-schedule";

const adminLaboratoriesKey = ["admin", "laboratories"] as const;

export function useAdminLaboratoriesQuery() {
  return useQuery({
    queryKey: adminLaboratoriesKey,
    queryFn: listAdminLaboratories,
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
      await queryClient.invalidateQueries({ queryKey: adminLaboratoriesKey });
    },
  });
}

export function useUpdateLaboratoryMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      values,
      schedules,
    }: {
      values: LaboratoryFormValues;
      schedules: LaboratoryScheduleInput[];
    }) => {
      const { data, error } = await supabase.functions.invoke("update-laboratory", {
        body: {
          laboratoryId: id,
          laboratory: {
            name: values.name,
            schoolName: values.schoolName,
            responsible: values.responsible,
            phone: values.phone,
            city: values.city,
            state: values.state,
            status: values.status,
            computerCount: values.computerCount,
          },
          schedules,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { laboratoryId: string };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminLaboratoriesKey }),
        queryClient.invalidateQueries({ queryKey: [...adminLaboratoriesKey, id] }),
      ]);
    },
  });
}

export function useToggleLaboratoryStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: "ativo" | "inativo" }) =>
      toggleLaboratoryStatus(id, currentStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminLaboratoriesKey });
    },
  });
}
