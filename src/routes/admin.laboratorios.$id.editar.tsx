import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { LaboratoryForm } from "@/components/LaboratoryForm";
import { Button } from "@/components/ui/button";
import { useLaboratories } from "@/lib/laboratories-store";
import { useLaboratorySchedules } from "@/lib/laboratory-schedules-store";

export const Route = createFileRoute("/admin/laboratorios/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar laboratório — Agendamento de Provas" },
      { name: "description", content: "Atualize os dados cadastrais do laboratório." },
    ],
  }),
  component: EditarLaboratorio,
});

function EditarLaboratorio() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { getById, update } = useLaboratories();
  const { listByLaboratory, replaceForLaboratory } = useLaboratorySchedules();
  const lab = getById(id);

  if (!lab) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Laboratório não encontrado.</p>
          <Button asChild variant="outline"><Link to="/admin/laboratorios">Voltar</Link></Button>
        </div>
      </AdminLayout>
    );
  }

  const schedules = listByLaboratory(id).map(({ dayOfWeek, startTime, endTime, active }) => ({
    dayOfWeek,
    startTime,
    endTime,
    active,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Editar laboratório</h1>
        <LaboratoryForm
          mode="edit"
          initialValues={lab}
          initialSchedules={schedules}
          onResetPassword={() => toast.info("Redefinição de senha será integrada ao Supabase posteriormente.")}
          onCancel={() => navigate({ to: "/admin/laboratorios/$id", params: { id } })}
          onSubmit={(values, nextSchedules) => {
            update(id, values);
            replaceForLaboratory(id, nextSchedules);
            toast.success("Alterações salvas com sucesso.");
            navigate({ to: "/admin/laboratorios/$id", params: { id } });
          }}
        />
      </div>
    </AdminLayout>
  );
}
