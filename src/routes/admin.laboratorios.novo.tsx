import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { LaboratoryForm } from "@/components/LaboratoryForm";
import { useLaboratories } from "@/lib/laboratories-store";
import { useLaboratoryAccess } from "@/lib/laboratory-access-store";
import { useLaboratorySchedules } from "@/lib/laboratory-schedules-store";

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
  const { create } = useLaboratories();
  const { upsert: upsertAccess } = useLaboratoryAccess();
  const { replaceForLaboratory } = useLaboratorySchedules();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Cadastrar laboratório</h1>
        <LaboratoryForm
          mode="create"
          onCancel={() => navigate({ to: "/admin/laboratorios" })}
          onSubmit={(values, access, schedules) => {
            const laboratory = create(values);
            upsertAccess(laboratory.id, access.email.trim());
            replaceForLaboratory(laboratory.id, schedules);
            toast.success("Laboratório cadastrado com sucesso.");
            navigate({ to: "/admin/laboratorios" });
          }}
        />
      </div>
    </AdminLayout>
  );
}
