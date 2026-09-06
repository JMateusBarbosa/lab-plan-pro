import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { examTypeLabels, type Exam } from "@/types/exam";

interface ExamCardProps {
  exam: Exam;
  onDelete: (exam: Exam) => void;
}

export function ExamCard({ exam, onDelete }: ExamCardProps) {
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
          <dt className="text-muted-foreground">Horário</dt>
          <dd>{exam.examTime}</dd>
          <dt className="text-muted-foreground">Computador</dt>
          <dd>PC {exam.pcNumber}</dd>
          <dt className="text-muted-foreground">Tipo</dt>
          <dd>{examTypeLabels[exam.examType]}</dd>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/laboratorio/provas/$id" params={{ id: exam.id }}>
              Ver
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/laboratorio/provas/$id/editar" params={{ id: exam.id }}>
              Editar
            </Link>
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(exam)}>
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
