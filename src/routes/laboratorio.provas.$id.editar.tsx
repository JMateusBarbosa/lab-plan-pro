import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { ExamForm } from "@/components/ExamForm";
import { Button } from "@/components/ui/button";
import { useExams } from "@/lib/exams-store";
import { useCurrentLaboratory, CURRENT_LABORATORY_ID } from "@/lib/laboratories-store";
import { useLaboratorySchedules } from "@/lib/laboratory-schedules-store";

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
  const lab = useCurrentLaboratory();
  const { listByLaboratory: listSchedules } = useLaboratorySchedules();
  const { getById, update, listByLaboratory } = useExams();
  const exam = getById(id);

  if (!lab || !exam || exam.laboratoryId !== CURRENT_LABORATORY_ID) {
    return (
      <LaboratoryLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Prova não encontrada.</p>
          <Button asChild variant="outline"><Link to="/laboratorio/provas">Voltar</Link></Button>
        </div>
      </LaboratoryLayout>
    );
  }

  const exams = listByLaboratory(CURRENT_LABORATORY_ID);
  const schedules = listSchedules(CURRENT_LABORATORY_ID);
  const previousExamOptions = exams.filter(
    (candidate) => candidate.id !== id && candidate.status === "reprovado",
  );

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Editar prova</h1>
        <ExamForm
          mode="edit"
          laboratory={lab}
          schedules={schedules}
          previousExamOptions={previousExamOptions}
          initialValues={exam}
          onCancel={() => navigate({ to: "/laboratorio/provas/$id", params: { id } })}
          onSubmit={(values) => {
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

            update(id, values);
            toast.success("Alterações salvas com sucesso.");
            navigate({ to: "/laboratorio/provas/$id", params: { id } });
          }}
        />
      </div>
    </LaboratoryLayout>
  );
}
