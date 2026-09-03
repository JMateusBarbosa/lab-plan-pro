import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { LaboratoryForm } from "@/components/LaboratoryForm";
import { Button } from "@/components/ui/button";
import { useLaboratories } from "@/lib/laboratories-store";

export const Route = createFileRoute("/admin/laboratorios/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar laboratório — Agendamento de Provas" },
      { name: "description", content: "Atualize os dados cadastrais do laboratório." },
      { property: "og:title", content: "Editar laboratório" },
      { property: "og:description", content: "Atualize os dados cadastrais do laboratório." },
    ],
  }),
  component: EditarLaboratorio,
});

function EditarLaboratorio() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { getById, update } = useLaboratories();
  const lab = getById(id);

  if (!lab) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Laboratório não encontrado.</p>
          <Button asChild variant="outline">
            <Link to="/admin/laboratorios">Voltar</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Editar laboratório</h1>
        <LaboratoryForm
          mode="edit"
          initialValues={lab}
          onResetPassword={() => toast.info("Redefinição de senha será implementada futuramente.")}
          onCancel={() => navigate({ to: "/admin/laboratorios/$id", params: { id } })}
          onSubmit={(values) => {
            update(id, values);
            toast.success("Alterações salvas com sucesso.");
            navigate({ to: "/admin/laboratorios/$id", params: { id } });
          }}
        />
      </div>
    </AdminLayout>
  );
}
