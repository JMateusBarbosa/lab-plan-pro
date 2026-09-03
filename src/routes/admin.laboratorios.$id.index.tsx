import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLaboratorySummary } from "@/data/laboratories";
import { useLaboratories } from "@/lib/laboratories-store";

export const Route = createFileRoute("/admin/laboratorios/$id/")({
  head: () => ({
    meta: [
      { title: "Detalhes do laboratório — Agendamento de Provas" },
      { name: "description", content: "Informações completas e resumo de provas do laboratório." },
      { property: "og:title", content: "Detalhes do laboratório" },
      {
        property: "og:description",
        content: "Informações completas e resumo de provas do laboratório.",
      },
    ],
  }),
  component: DetalhesLaboratorio,
});

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function DetalhesLaboratorio() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { getById, toggleStatus } = useLaboratories();
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">{lab.name}</h1>
            <p className="text-sm text-muted-foreground">{lab.schoolName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/admin/laboratorios/$id/editar" params={{ id: lab.id }}>
                Editar laboratório
              </Link>
            </Button>
            <Button variant="outline" onClick={() => toggleStatus(lab.id)}>
              {lab.status === "ativo" ? "Desativar" : "Ativar"}
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/admin/laboratorios" })}>
              Voltar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Nome do laboratório" value={lab.name} />
              <Info label="Unidade/escola" value={lab.schoolName} />
              <Info label="Responsável" value={lab.responsible} />
              <Info label="Telefone" value={lab.phone} />
              <Info label="Cidade" value={lab.city} />
              <Info label="Estado" value={lab.state} />
              <Info label="Status" value={<StatusBadge status={lab.status} />} />
              <Info label="Data de cadastro" value={lab.createdAt} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações de acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <Info label="E-mail/login" value={lab.email} />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-base font-semibold">Resumo</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard title="Provas agendadas" value={mockLaboratorySummary.agendadas} />
            <DashboardCard title="Provas realizadas" value={mockLaboratorySummary.realizadas} />
            <DashboardCard title="Provas pendentes" value={mockLaboratorySummary.pendentes} />
            <DashboardCard title="Provas hoje" value={mockLaboratorySummary.hoje} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
