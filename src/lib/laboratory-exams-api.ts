import { supabase } from "@/lib/supabase";
import type { Exam, ExamFormValues } from "@/types/exam";

function mapExam(row: {
  id: string;
  laboratory_id: string;
  student_name: string;
  module: string;
  student_class_time: string;
  exam_date: string;
  pc_number: number;
  exam_type: string;
  status: string;
  previous_exam_id: string | null;
  created_at: string;
  updated_at: string;
}): Exam {
  return {
    id: row.id,
    laboratoryId: row.laboratory_id,
    studentName: row.student_name,
    module: row.module,
    studentClassTime: row.student_class_time.slice(0, 5),
    examDate: row.exam_date,
    pcNumber: row.pc_number,
    examType: row.exam_type as Exam["examType"],
    status: row.status as Exam["status"],
    previousExamId: row.previous_exam_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function translateExamError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("exams_unique_pc_slot") || normalized.includes("duplicate key")) {
    return "Este computador já está agendado para a mesma data e horário de aula.";
  }
  if (normalized.includes("pc") && normalized.includes("não existe")) return message;
  if (normalized.includes("não existe horário ativo")) return message;
  if (normalized.includes("recuperação") || normalized.includes("prova anterior")) return message;
  if (normalized.includes("cadeia histórica") || normalized.includes("ciclo")) return message;

  return message;
}

export async function listLaboratoryExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("exam_date", { ascending: false })
    .order("student_class_time", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(translateExamError(error.message));
  return (data ?? []).map(mapExam);
}

export async function getLaboratoryExam(id: string): Promise<Exam | null> {
  const { data, error } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(translateExamError(error.message));
  return data ? mapExam(data) : null;
}

export async function createLaboratoryExam(laboratoryId: string, values: ExamFormValues): Promise<Exam> {
  const { data, error } = await supabase
    .from("exams")
    .insert({
      laboratory_id: laboratoryId,
      student_name: values.studentName.trim(),
      module: values.module.trim(),
      student_class_time: values.studentClassTime,
      exam_date: values.examDate,
      pc_number: values.pcNumber,
      exam_type: values.examType,
      status: "pendente",
      previous_exam_id: values.examType === "recuperacao" ? values.previousExamId : null,
    })
    .select("*")
    .single();

  if (error) throw new Error(translateExamError(error.message));
  return mapExam(data);
}

export async function updateLaboratoryExam(id: string, values: ExamFormValues): Promise<Exam> {
  const { data, error } = await supabase
    .from("exams")
    .update({
      student_name: values.studentName.trim(),
      module: values.module.trim(),
      student_class_time: values.studentClassTime,
      exam_date: values.examDate,
      pc_number: values.pcNumber,
      exam_type: values.examType,
      status: values.status,
      previous_exam_id: values.examType === "recuperacao" ? values.previousExamId : null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(translateExamError(error.message));
  return mapExam(data);
}

export async function deleteLaboratoryExam(id: string) {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw new Error(translateExamError(error.message));
}
