import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { PageHeader } from "@/components/PageHeader";
import { ExamForm } from "@/components/ExamForm";
import { Button } from "@/components/ui/button";
import { useLaboratorySessionQuery } from "@/lib/laboratory-session-queries";
import {
  useCreateLaboratoryExamMutation,
  useLaboratoryExamsQuery,
} from "@/lib/laboratory-exams-queries";

export const Route = createFileRoute("/laboratorio/provas/nova")({
  head: () => ({
    meta: [
      { title: "Agendar prova — Agendamento de Provas" },
      { name: "description", content: "Agende uma nova prova no laboratório." },
    ],
  }),
  component: NovaProva,
});

function NovaProva() {
  const navigate = useNavigate();
  const { data: session } = useLaboratorySessionQuery();
  const { data: exams = [], isLoading: loadingExams, isError, refetch } = useLaboratoryExamsQuery();
  const createExam = useCreateLaboratoryExamMutation(session?.laboratory.id ?? "");

  if (!session) {
    return <LaboratoryLayout><p className="text-sm text-muted-foreground">Carregando laboratório...</p></LaboratoryLayout>;
  }

  if (loadingExams) {
    return <LaboratoryLayout><p className="text-sm text-muted-foreground">Carregando dados das provas...</p></LaboratoryLayout>;
  }

  if (isError) {
    return (
      <LaboratoryLayout>
        <div className="space-y-3">
          <p className="text-sm text-destructive">Não foi possível carregar os dados necessários para o agendamento.</p>
          <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      </LaboratoryLayout>
    );
  }

  const examsWithRecovery = new Set(
    exams.map((exam) => exam.previousExamId).filter((id): id is string => Boolean(id)),
  );
  const previousExamOptions = exams.filter(
    (exam) => exam.status === "reprovado" && !examsWithRecovery.has(exam.id),
  );

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <PageHeader
          title="Agendar prova"
          description="Informe os dados da P1. Recuperações são criadas pelo fluxo da tentativa anterior."
        />
        <ExamForm
          mode="create"
          laboratory={session.laboratory}
          schedules={session.schedules}
          previousExamOptions={previousExamOptions}
          submitting={createExam.isPending}
          onCancel={() => navigate({ to: "/laboratorio/provas" })}
          onSubmit={async (values) => {
            if (createExam.isPending) return;

            const hasConflict = exams.some(
              (exam) =>
                exam.examDate === values.examDate &&
                exam.studentClassTime === values.studentClassTime &&
                exam.pcNumber === values.pcNumber,
            );

            if (hasConflict) {
              toast.error("Este computador já está agendado para a mesma data e horário de aula.");
              return;
            }

            try {
              await createExam.mutateAsync(values);
              toast.success("Prova agendada com sucesso.");
              navigate({ to: "/laboratorio/provas" });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Não foi possível agendar a prova.");
            }
          }}
        />
      </div>
    </LaboratoryLayout>
  );
}
