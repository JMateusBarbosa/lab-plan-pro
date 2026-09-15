import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { LaboratoryForm } from "@/components/LaboratoryForm";
import { useProvisionLaboratoryMutation } from "@/lib/admin-laboratories-queries";

export const Route = createFileRoute("/admin/laboratorios/novo")({
  head: () => ({
    meta: [
      { title: "Novo laboratório — Agendamento de Provas" },
      { name: "description", content: "Cadastro de um novo laboratório no sistema." },
    ],
  }),
  component: NovoLaboratorio,
});

function NovoLaboratorio() {
  const navigate = useNavigate();
  const provision = useProvisionLaboratoryMutation();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Cadastrar laboratório</h1>
        <LaboratoryForm
          mode="create"
          onCancel={() => navigate({ to: "/admin/laboratorios" })}
          onSubmit={async (values, access, schedules) => {
            if (provision.isPending) return;

            try {
              await provision.mutateAsync({ values, access, schedules });
              toast.success("Laboratório cadastrado com sucesso.");
              navigate({ to: "/admin/laboratorios" });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Não foi possível cadastrar o laboratório.";
              toast.error(message);
            }
          }}
        />
      </div>
    </AdminLayout>
  );
}
