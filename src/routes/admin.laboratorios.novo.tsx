import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { LaboratoryForm } from "@/components/LaboratoryForm";
import { useLaboratories } from "@/lib/laboratories-store";

export const Route = createFileRoute("/admin/laboratorios/novo")({
  head: () => ({
    meta: [
      { title: "Novo laboratório — Agendamento de Provas" },
      { name: "description", content: "Cadastro de um novo laboratório no sistema." },
      { property: "og:title", content: "Novo laboratório" },
      { property: "og:description", content: "Cadastro de um novo laboratório no sistema." },
    ],
  }),
  component: NovoLaboratorio,
});

function NovoLaboratorio() {
  const navigate = useNavigate();
  const { create } = useLaboratories();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Cadastrar laboratório</h1>
        <LaboratoryForm
          mode="create"
          onCancel={() => navigate({ to: "/admin/laboratorios" })}
          onSubmit={(values) => {
            create(values);
            toast.success("Laboratório cadastrado com sucesso.");
            navigate({ to: "/admin/laboratorios" });
          }}
        />
      </div>
    </AdminLayout>
  );
}
