import type { Exam } from "@/types/exam";

/**
 * Verifica se apontar uma prova para `previousExamId` criaria (ou manteria)
 * um ciclo na cadeia de recuperações.
 *
 * A validação existe no frontend para impedir opções inválidas na edição.
 * Quando o CRUD for migrado para o Supabase, a mesma regra também deve ser
 * garantida no banco para não depender apenas da interface.
 */
export function wouldCreateExamLineageCycle(
  exams: Exam[],
  examId: string,
  previousExamId: string | null,
): boolean {
  if (!previousExamId) return false;
  if (previousExamId === examId) return true;

  const examsById = new Map(exams.map((exam) => [exam.id, exam]));
  const visited = new Set<string>();
  let currentId: string | null = previousExamId;

  while (currentId) {
    if (currentId === examId) return true;
    if (visited.has(currentId)) return true;

    visited.add(currentId);
    currentId = examsById.get(currentId)?.previousExamId ?? null;
  }

  return false;
}
