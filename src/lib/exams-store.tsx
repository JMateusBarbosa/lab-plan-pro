import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mockExams } from "@/data/exams";
import { getLocalDateString } from "@/lib/date";
import type { Exam, ExamFormValues } from "@/types/exam";

interface ExamsContextValue {
  exams: Exam[];
  listByLaboratory: (laboratoryId: string) => Exam[];
  getById: (id: string) => Exam | undefined;
  create: (laboratoryId: string, values: ExamFormValues) => Exam;
  update: (id: string, values: ExamFormValues) => void;
  remove: (id: string) => void;
}

const ExamsContext = createContext<ExamsContextValue | null>(null);

export function ExamsProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>(mockExams);

  const listByLaboratory = useCallback(
    (laboratoryId: string) => exams.filter((exam) => exam.laboratoryId === laboratoryId),
    [exams],
  );

  const getById = useCallback((id: string) => exams.find((exam) => exam.id === id), [exams]);

  const create = useCallback((laboratoryId: string, values: ExamFormValues) => {
    const now = getLocalDateString();
    const exam: Exam = {
      id: String(Date.now()),
      laboratoryId,
      studentName: values.studentName,
      module: values.module,
      studentClassTime: values.studentClassTime,
      examDate: values.examDate,
      pcNumber: Number(values.pcNumber),
      examType: values.examType,
      status: values.status,
      previousExamId: values.previousExamId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    setExams((prev) => [exam, ...prev]);
    return exam;
  }, []);

  const update = useCallback((id: string, values: ExamFormValues) => {
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === id
          ? {
              ...exam,
              studentName: values.studentName,
              module: values.module,
              studentClassTime: values.studentClassTime,
              examDate: values.examDate,
              pcNumber: Number(values.pcNumber),
              examType: values.examType,
              status: values.status,
              previousExamId: values.previousExamId ?? null,
              updatedAt: getLocalDateString(),
            }
          : exam,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setExams((prev) => prev.filter((exam) => exam.id !== id));
  }, []);

  const value = useMemo(
    () => ({ exams, listByLaboratory, getById, create, update, remove }),
    [exams, listByLaboratory, getById, create, update, remove],
  );

  return <ExamsContext.Provider value={value}>{children}</ExamsContext.Provider>;
}

export function useExams() {
  const ctx = useContext(ExamsContext);
  if (!ctx) throw new Error("useExams deve ser usado dentro de ExamsProvider");
  return ctx;
}
