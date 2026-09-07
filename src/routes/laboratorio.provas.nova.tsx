import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { ExamForm } from "@/components/ExamForm";
import { useCurrentLaboratory, CURRENT_LABORATORY_ID } from "@/lib/laboratories-store";
import { useExams } from "@/lib/exams-store";

export const Route = createFileRoute("/laboratorio/provas/nova")({
  head: () => ({
    meta: [
      { title: "Agendar prova — Agendamento de Provas" },
      { name: "description", content: "Agende uma nova prova no laboratório." },
      { property: "og:title", content: "Agendar prova" },
      { property: "og:description", content: "Agende uma nova prova no laboratório." },
    ],
  }),
  component: NovaProva,
});

function NovaProva() {
  const navigate = useNavigate();
  const lab = useCurrentLaboratory();
  const { create, listByLaboratory } = useExams();

  if (!lab) {
    return (
      <LaboratoryLayout>
        <p className="text-sm text-muted-foreground">Laboratório não encontrado.</p>
      </LaboratoryLayout>
    );
  }

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Agendar prova</h1>
        <ExamForm
          mode="create"
          laboratory={lab}
          onCancel={() => navigate({ to: "/laboratorio/provas" })}
          onSubmit={(values) => {
            const hasConflict = listByLaboratory(CURRENT_LABORATORY_ID).some(
              (exam) =>
                exam.examDate === values.examDate &&
                exam.examTime === values.examTime &&
                exam.pcNumber === values.pcNumber,
            );

            if (hasConflict) {
              toast.error("Este computador já está agendado para a mesma data e horário.");
              return;
            }

            create(CURRENT_LABORATORY_ID, { ...values, status: "pendente" });
            toast.success("Prova agendada com sucesso.");
            navigate({ to: "/laboratorio/provas" });
          }}
        />
      </div>
    </LaboratoryLayout>
  );
}
