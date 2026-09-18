import { supabase } from "@/lib/supabase";
import type { Exam, ExamFormValues } from "@/types/exam";

type DatabaseError = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

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

function translateExamError(error: DatabaseError) {
  const combined = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combined.includes("exams_unique_pc_slot")) {
    return "Este computador já está agendado para a mesma data e horário de aula.";
  }

  if (combined.includes("exams_single_recovery_child")) {
    return "Esta tentativa já possui uma recuperação vinculada.";
  }

  if (error.code === "42501" || combined.includes("row-level security")) {
    return "Você não possui permissão para realizar esta operação.";
  }

  if (combined.includes("prova não encontrada ou já excluída")) {
    return "Esta prova não existe mais ou já foi excluída.";
  }

  if (combined.includes("pc") && combined.includes("não existe")) return error.message;
  if (combined.includes("não existe horário ativo")) return error.message;
  if (combined.includes("recuperação") || combined.includes("prova anterior")) return error.message;
  if (combined.includes("cadeia histórica") || combined.includes("ciclo")) return error.message;

  if (error.code === "23505") {
    return "Já existe uma prova conflitante com estes dados.";
  }

  return error.message;
}

export async function listLaboratoryExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("exam_date", { ascending: false })
    .order("student_class_time", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(translateExamError(error));
  return (data ?? []).map(mapExam);
}

export async function getLaboratoryExam(id: string): Promise<Exam | null> {
  const { data, error } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(translateExamError(error));
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

  if (error) throw new Error(translateExamError(error));
  return mapExam(data);
}

export async function updateLaboratoryExamStatus(id: string, status: Exam["status"]): Promise<Exam> {
  const { data, error } = await supabase
    .from("exams")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(translateExamError(error));
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

  if (error) throw new Error(translateExamError(error));
  return mapExam(data);
}

export async function deleteLaboratoryExam(id: string) {
  const { error } = await supabase.rpc("soft_delete_exam", { p_exam_id: id });
  if (error) throw new Error(translateExamError(error));
}
