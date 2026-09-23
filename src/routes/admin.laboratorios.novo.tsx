import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
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
        <PageHeader
          title="Cadastrar laboratório"
          description="Cadastre a unidade, os horários e os dados de acesso do novo laboratório."
          breadcrumbs={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/admin">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/admin/laboratorios">Laboratórios</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Novo laboratório</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        <LaboratoryForm
          mode="create"
          submitting={provision.isPending}
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
