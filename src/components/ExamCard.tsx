import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { ExamResultDialog } from "@/components/ExamResultDialog";
import {
  canScheduleNextAttempt,
  findNextAttempt,
  getExamAttemptLabel,
} from "@/lib/exam-lineage";
import type { Exam } from "@/types/exam";

interface ExamCardProps {
  exam: Exam;
  exams: Exam[];
  onDelete: (exam: Exam) => void;
}

export function ExamCard({ exam, exams, onDelete }: ExamCardProps) {
  const nextExam = findNextAttempt(exams, exam.id);
  const canScheduleNext = canScheduleNextAttempt(exams, exam);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{exam.studentName}</p>
            <p className="truncate text-sm text-muted-foreground">{exam.module}</p>
          </div>
          <ExamStatusBadge status={exam.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Data</dt>
          <dd>{exam.examDate}</dd>
          <dt className="text-muted-foreground">Horário da aula</dt>
          <dd>{exam.studentClassTime}</dd>
          <dt className="text-muted-foreground">Computador</dt>
          <dd>PC {exam.pcNumber}</dd>
          <dt className="text-muted-foreground">Tentativa</dt>
          <dd>{getExamAttemptLabel(exams, exam)}</dd>
        </dl>

        {exam.status === "reprovado" && !nextExam ? (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Aguardando agendamento da próxima tentativa.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {exam.status === "pendente" ? <ExamResultDialog exam={exam} exams={exams} /> : null}
          {canScheduleNext ? (
            <Button asChild size="sm">
              <Link to="/laboratorio/provas/$id/proxima" params={{ id: exam.id }}>
                Agendar próxima tentativa
              </Link>
            </Button>
          ) : null}
          {nextExam ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/laboratorio/provas/$id" params={{ id: nextExam.id }}>Ver próxima</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link to="/laboratorio/provas/$id" params={{ id: exam.id }}>Ver</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/laboratorio/provas/$id/editar" params={{ id: exam.id }}>Editar dados</Link>
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(exam)}>Excluir</Button>
        </div>
      </CardContent>
    </Card>
  );
}
