import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ExamResultDialog } from "@/components/ExamResultDialog";
import { ExamAttemptTimeline } from "@/components/ExamAttemptTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDeleteLaboratoryExamMutation,
  useLaboratoryExamQuery,
  useLaboratoryExamsQuery,
} from "@/lib/laboratory-exams-queries";
import { examTypeLabels } from "@/types/exam";
import {
  canScheduleNextAttempt,
  findNextAttempt,
  getExamAttemptLabel,
} from "@/lib/exam-lineage";

export const Route = createFileRoute("/laboratorio/provas/$id/")({
  head: () => ({
    meta: [
      { title: "Detalhes da prova — Agendamento de Provas" },
      { name: "description", content: "Informações completas da prova agendada." },
    ],
  }),
  component: DetalhesProva,
});

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function DetalhesProva() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: exam, isLoading, isError, refetch } = useLaboratoryExamQuery(id);
  const {
    data: exams = [],
    isLoading: isLoadingExams,
    isError: isExamsError,
    refetch: refetchExams,
  } = useLaboratoryExamsQuery();
  const deleteExam = useDeleteLaboratoryExamMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || isLoadingExams) {
    return <LaboratoryLayout><p className="text-sm text-muted-foreground">Carregando prova...</p></LaboratoryLayout>;
  }

  if (isError || isExamsError) {
    return (
      <LaboratoryLayout>
        <div className="space-y-3">
          <p className="text-sm text-destructive">Não foi possível carregar a prova.</p>
          <Button variant="outline" onClick={() => void Promise.all([refetch(), refetchExams()])}>Tentar novamente</Button>
        </div>
      </LaboratoryLayout>
    );
  }

  if (!exam) {
    return (
      <LaboratoryLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Prova não encontrada.</p>
          <Button asChild variant="outline"><Link to="/laboratorio/provas">Voltar</Link></Button>
        </div>
      </LaboratoryLayout>
    );
  }

  const nextExam = findNextAttempt(exams, exam.id);
  const attemptLabel = getExamAttemptLabel(exams, exam);
  const canScheduleNext = canScheduleNextAttempt(exams, exam);

  const handleDelete = async () => {
    if (deleteExam.isPending) return;

    try {
      await deleteExam.mutateAsync(exam.id);
      toast.success("Prova excluída com sucesso.");
      navigate({ to: "/laboratorio/provas" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir a prova.");
    }
  };

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">{exam.studentName}</h1>
            <p className="text-sm text-muted-foreground">{exam.module}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExamResultDialog exam={exam} exams={exams} />
            {canScheduleNext ? (
              <Button asChild>
                <Link to="/laboratorio/provas/$id/proxima" params={{ id: exam.id }}>Agendar próxima tentativa</Link>
              </Button>
            ) : null}
            {nextExam ? (
              <Button asChild variant="outline">
                <Link to="/laboratorio/provas/$id" params={{ id: nextExam.id }}>Ver próxima tentativa</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline"><Link to="/laboratorio/provas/$id/editar" params={{ id: exam.id }}>Editar dados</Link></Button>
            <Button variant="destructive" disabled={deleteExam.isPending} onClick={() => setConfirmOpen(true)}>Excluir</Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/laboratorio/provas" })}>Voltar</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Informações da prova</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Nome do aluno" value={exam.studentName} />
              <Info label="Módulo" value={exam.module} />
              <Info label="Data" value={exam.examDate} />
              <Info label="Horário da aula" value={exam.studentClassTime} />
              <Info label="Computador" value={`PC ${exam.pcNumber}`} />
              <Info label="Tentativa" value={attemptLabel} />
              <Info label="Status" value={<ExamStatusBadge status={exam.status} />} />
              <Info label="Data do cadastro" value={new Date(exam.createdAt).toLocaleString("pt-BR")} />
            </dl>
          </CardContent>
        </Card>

        {exam.status === "reprovado" && !nextExam ? (
          <Card className="border-amber-200">
            <CardHeader><CardTitle className="text-base">Próxima ação</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Esta tentativa foi reprovada e ainda não possui uma próxima tentativa agendada.
              </p>
              <Button asChild>
                <Link to="/laboratorio/provas/$id/proxima" params={{ id: exam.id }}>Agendar próxima tentativa</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <ExamAttemptTimeline exam={exam} exams={exams} />
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={(open) => !deleteExam.isPending && setConfirmOpen(open)}
        title="Excluir prova"
        description={`A prova de ${exam.studentName} será removida.`}
        confirmLabel={deleteExam.isPending ? "Excluindo..." : "Excluir"}
        onConfirm={() => void handleDelete()}
      />
    </LaboratoryLayout>
  );
}
