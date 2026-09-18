import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLaboratoryExam,
  deleteLaboratoryExam,
  getLaboratoryExam,
  listLaboratoryExams,
  updateLaboratoryExam,
  updateLaboratoryExamStatus,
} from "@/lib/laboratory-exams-api";
import type { Exam, ExamFormValues } from "@/types/exam";

export const laboratoryExamsKey = ["laboratory", "exams"] as const;

export function useLaboratoryExamsQuery() {
  return useQuery({
    queryKey: laboratoryExamsKey,
    queryFn: listLaboratoryExams,
  });
}

export function useLaboratoryExamQuery(id: string) {
  return useQuery({
    queryKey: [...laboratoryExamsKey, id],
    queryFn: () => getLaboratoryExam(id),
    enabled: Boolean(id),
  });
}

export function useCreateLaboratoryExamMutation(laboratoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ExamFormValues) => createLaboratoryExam(laboratoryId, values),
    onSuccess: async (exam) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: laboratoryExamsKey }),
        queryClient.invalidateQueries({ queryKey: [...laboratoryExamsKey, exam.id] }),
      ]);
    },
  });
}

export function useUpdateLaboratoryExamStatusMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: Exam["status"]) => updateLaboratoryExamStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: laboratoryExamsKey }),
        queryClient.invalidateQueries({ queryKey: [...laboratoryExamsKey, id] }),
      ]);
    },
  });
}

export function useUpdateLaboratoryExamMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ExamFormValues) => updateLaboratoryExam(id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: laboratoryExamsKey }),
        queryClient.invalidateQueries({ queryKey: [...laboratoryExamsKey, id] }),
      ]);
    },
  });
}

export function useDeleteLaboratoryExamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLaboratoryExam(id),
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: [...laboratoryExamsKey, id] });
      await queryClient.invalidateQueries({ queryKey: laboratoryExamsKey });
    },
  });
}
