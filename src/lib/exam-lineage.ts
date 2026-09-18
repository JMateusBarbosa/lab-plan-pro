import type { Exam } from "@/types/exam";

/**
 * Verifica se apontar uma prova para `previousExamId` criaria (ou manteria)
 * um ciclo na cadeia de tentativas.
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

export function findNextAttempt(exams: Exam[], examId: string): Exam | undefined {
  return exams.find((exam) => exam.previousExamId === examId);
}

/**
 * Retorna a cadeia histórica completa da tentativa informada:
 * P1 -> Recuperação 1 -> Recuperação 2 -> ...
 *
 * A montagem parte da tentativa atual, percorre os ancestrais até a raiz
 * e depois segue os descendentes. Os conjuntos de visitados evitam loops
 * caso dados antigos ou inconsistentes contenham ciclos.
 */
export function getExamAttemptChain(exams: Exam[], exam: Exam): Exam[] {
  const examsById = new Map(exams.map((candidate) => [candidate.id, candidate]));
  const ancestors: Exam[] = [];
  const visited = new Set<string>();

  let current: Exam | undefined = exam;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    ancestors.push(current);

    if (!current.previousExamId) break;
    current = examsById.get(current.previousExamId);
  }

  const chain = ancestors.reverse();
  current = exam;

  while (current) {
    const next = findNextAttempt(exams, current.id);
    if (!next || visited.has(next.id)) break;

    visited.add(next.id);
    chain.push(next);
    current = next;
  }

  return chain;
}

export function getRecoveryNumber(exams: Exam[], exam: Exam): number {
  if (exam.examType === "p1") return 0;

  const examsById = new Map(exams.map((candidate) => [candidate.id, candidate]));
  const visited = new Set<string>();
  let current: Exam | undefined = exam;
  let recoveryNumber = 0;

  while (current?.previousExamId) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    recoveryNumber += 1;
    current = examsById.get(current.previousExamId);
  }

  return Math.max(1, recoveryNumber);
}

export function getExamAttemptLabel(exams: Exam[], exam: Exam): string {
  if (exam.examType === "p1") return "P1";
  return `Recuperação ${getRecoveryNumber(exams, exam)}`;
}

export function getNextAttemptLabel(exams: Exam[], exam: Exam): string {
  const currentRecovery = getRecoveryNumber(exams, exam);
  return `Recuperação ${currentRecovery + 1}`;
}

export function canScheduleNextAttempt(exams: Exam[], exam: Exam): boolean {
  return exam.status === "reprovado" && !findNextAttempt(exams, exam.id);
}
