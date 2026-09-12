export type ExamType = "p1" | "recuperacao";
export type ExamStatus = "pendente" | "aprovado" | "reprovado";

export interface Exam {
  id: string;
  laboratoryId: string;
  studentName: string;
  module: string;
  studentClassTime: string; // HH:MM
  examDate: string; // YYYY-MM-DD
  pcNumber: number;
  examType: ExamType;
  status: ExamStatus;
  previousExamId: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type ExamFormValues = Omit<
  Exam,
  "id" | "laboratoryId" | "createdAt" | "updatedAt"
>;

export const examTypeLabels: Record<ExamType, string> = {
  p1: "P1",
  recuperacao: "Recuperação",
};

export const examStatusLabels: Record<ExamStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};
