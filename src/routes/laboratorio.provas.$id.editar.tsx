import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { ExamForm } from "@/components/ExamForm";
import { Button } from "@/components/ui/button";
import { useExams } from "@/lib/exams-store";
import { useCurrentLaboratory, CURRENT_LABORATORY_ID } from "@/lib/laboratories-store";

export const Route = createFileRoute("/laboratorio/provas/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar prova — Agendamento de Provas" },
      { name: "description", content: "Atualize os dados da prova agendada." },
      { property: "og:title", content: "Editar prova" },
      { property: "og:description", content: "Atualize os dados da prova agendada." },
    ],
  }),
  component: EditarProva,
});

function EditarProva() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const lab = useCurrentLaboratory();
  const { getById, update } = useExams();
  const exam = getById(id);

  if (!lab || !exam || exam.laboratoryId !== CURRENT_LABORATORY_ID) {
    return (
      <LaboratoryLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Prova não encontrada.</p>
          <Button asChild variant="outline">
            <Link to="/laboratorio/provas">Voltar</Link>
          </Button>
        </div>
      </LaboratoryLayout>
    );
  }

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Editar prova</h1>
        <ExamForm
          mode="edit"
          laboratory={lab}
          initialValues={exam}
          onCancel={() => navigate({ to: "/laboratorio/provas/$id", params: { id } })}
          onSubmit={(values) => {
            update(id, values);
            toast.success("Alterações salvas com sucesso.");
            navigate({ to: "/laboratorio/provas/$id", params: { id } });
          }}
        />
      </div>
    </LaboratoryLayout>
  );
}
