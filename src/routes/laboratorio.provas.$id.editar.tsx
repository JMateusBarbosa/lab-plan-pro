import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { PageHeader } from "@/components/PageHeader";
import { ExamForm } from "@/components/ExamForm";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useLaboratoryExamQuery,
  useLaboratoryExamsQuery,
  useUpdateLaboratoryExamMutation,
} from "@/lib/laboratory-exams-queries";
import { useLaboratorySessionQuery } from "@/lib/laboratory-session-queries";
import { wouldCreateExamLineageCycle } from "@/lib/exam-lineage";

export const Route = createFileRoute("/laboratorio/provas/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar prova — Agendamento de Provas" },
      { name: "description", content: "Atualize os dados da prova agendada." },
    ],
  }),
  component: EditarProva,
});

function EditarProva() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useLaboratorySessionQuery();
  const { data: exam, isLoading: loadingExam, isError: examError, refetch: refetchExam } = useLaboratoryExamQuery(id);
  const { data: exams = [], isLoading: loadingExams, isError: examsError, refetch: refetchExams } = useLaboratoryExamsQuery();
  const updateExam = useUpdateLaboratoryExamMutation(id);

  if (!session || loadingExam || loadingExams) {
    return <LaboratoryLayout><p className="text-sm text-muted-foreground">Carregando prova...</p></LaboratoryLayout>;
  }

  if (examError || examsError) {
    return (
      <LaboratoryLayout>
        <div className="space-y-3">
          <p className="text-sm text-destructive">Não foi possível carregar os dados da prova.</p>
          <Button
            variant="outline"
            onClick={() => void Promise.all([refetchExam(), refetchExams()])}
          >
            Tentar novamente
          </Button>
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

  const examsWithRecovery = new Set(
    exams
      .filter((candidate) => candidate.id !== exam.id)
      .map((candidate) => candidate.previousExamId)
      .filter((candidateId): candidateId is string => Boolean(candidateId)),
  );

  const previousExamOptions = exams.filter(
    (candidate) =>
      candidate.id !== id &&
      candidate.status === "reprovado" &&
      !examsWithRecovery.has(candidate.id) &&
      !wouldCreateExamLineageCycle(exams, id, candidate.id),
  );

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <PageHeader
          title="Editar prova"
          description={exam.studentName + " · " + exam.module}
          breadcrumbs={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/laboratorio/provas">Provas</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/laboratorio/provas/$id" params={{ id }}>{exam.studentName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Editar</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <ExamForm
          mode="edit"
          laboratory={session.laboratory}
          schedules={session.schedules}
          previousExamOptions={previousExamOptions}
          initialValues={exam}
          submitting={updateExam.isPending}
          onCancel={() => navigate({ to: "/laboratorio/provas/$id", params: { id } })}
          onSubmit={async (values) => {
            if (updateExam.isPending) return;

            const hasConflict = exams.some(
              (candidate) =>
                candidate.id !== id &&
                candidate.examDate === values.examDate &&
                candidate.studentClassTime === values.studentClassTime &&
                candidate.pcNumber === values.pcNumber,
            );

            if (hasConflict) {
              toast.error("Este computador já está agendado para a mesma data e horário de aula.");
              return;
            }

            if (values.examType === "recuperacao" && wouldCreateExamLineageCycle(exams, id, values.previousExamId)) {
              toast.error("A prova anterior selecionada criaria um ciclo no histórico de recuperações.");
              return;
            }

            try {
              await updateExam.mutateAsync(values);
              toast.success("Alterações salvas com sucesso.");
              navigate({ to: "/laboratorio/provas/$id", params: { id } });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
            }
          }}
        />
      </div>
    </LaboratoryLayout>
  );
}
