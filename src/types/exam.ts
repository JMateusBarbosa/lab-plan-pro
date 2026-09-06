export type ExamType = "P1" | "REC1" | "REC2";
export type ExamStatus = "pendente" | "aprovado";

export interface Exam {
  id: string;
  laboratoryId: string;
  studentName: string;
  module: string;
  pcNumber: number;
  examDate: string; // YYYY-MM-DD
  examTime: string; // HH:MM
  examType: ExamType;
  status: ExamStatus;
  createdAt: string; // YYYY-MM-DD
}

export type ExamFormValues = Omit<Exam, "id" | "laboratoryId" | "createdAt">;

export const examTypeLabels: Record<ExamType, string> = {
  P1: "P1",
  REC1: "Recuperação 1",
  REC2: "Recuperação 2",
};

export const examStatusLabels: Record<ExamStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
};
