import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { LaboratoryForm } from "@/components/LaboratoryForm";
import { Button } from "@/components/ui/button";
import {
  useAdminLaboratoryQuery,
  useUpdateLaboratoryMutation,
} from "@/lib/admin-laboratories-queries";

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
  const { data: details, isLoading, isError, refetch } = useAdminLaboratoryQuery(id);
  const update = useUpdateLaboratoryMutation(id);

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-sm text-muted-foreground">Carregando laboratório...</p>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="space-y-3">
          <p className="text-sm text-destructive">Não foi possível carregar o laboratório.</p>
          <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      </AdminLayout>
    );
  }

  if (!details) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Laboratório não encontrado.</p>
          <Button asChild variant="outline"><Link to="/admin/laboratorios">Voltar</Link></Button>
        </div>
      </AdminLayout>
    );
  }

  const { laboratory: lab, accessEmail, schedules } = details;
  const initialSchedules = schedules.map(({ dayOfWeek, startTime, endTime, active }) => ({
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
          initialAccess={{ email: accessEmail }}
          initialSchedules={initialSchedules}
          submitting={update.isPending}
          onResetPassword={() => toast.info("A redefinição de senha será tratada no gerenciamento da conta de acesso.")}
          onCancel={() => navigate({ to: "/admin/laboratorios/$id", params: { id } })}
          onSubmit={async (values, _access, nextSchedules) => {
            if (update.isPending) return;

            try {
              await update.mutateAsync({ values, schedules: nextSchedules });
              toast.success("Alterações salvas com sucesso.");
              navigate({ to: "/admin/laboratorios/$id", params: { id } });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Não foi possível salvar as alterações.";
              toast.error(message);
            }
          }}
        />
      </div>
    </AdminLayout>
  );
}
