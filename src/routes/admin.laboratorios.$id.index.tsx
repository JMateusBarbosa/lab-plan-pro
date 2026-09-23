import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAdminLaboratoryQuery,
  useToggleLaboratoryStatusMutation,
} from "@/lib/admin-laboratories-queries";
import { dayOfWeekLabels } from "@/types/laboratory-schedule";

export const Route = createFileRoute("/admin/laboratorios/$id/")({
  head: () => ({
    meta: [
      { title: "Detalhes do laboratório — Agendamento de Provas" },
      { name: "description", content: "Informações completas do laboratório." },
    ],
  }),
  component: DetalhesLaboratorio,
});

function Info({ label, value }: { label: string; value: ReactNode }) {
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
  const { data: details, isLoading, isError, refetch } = useAdminLaboratoryQuery(id);
  const toggleStatus = useToggleLaboratoryStatusMutation();

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

  const { laboratory: lab, accessEmail, schedules, examSummary } = details;

  const handleToggleStatus = async () => {
    if (toggleStatus.isPending) return;
    try {
      await toggleStatus.mutateAsync({ id: lab.id, currentStatus: lab.status });
      toast.success(lab.status === "ativo" ? "Laboratório desativado." : "Laboratório ativado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível alterar o status.";
      toast.error(message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title={lab.name}
          description={lab.schoolName}
          actions={
            <>
              <Button asChild>
                <Link to="/admin/laboratorios/$id/editar" params={{ id: lab.id }}>Editar laboratório</Link>
              </Button>
              <Button variant="outline" disabled={toggleStatus.isPending} onClick={() => void handleToggleStatus()}>
                {lab.status === "ativo" ? "Desativar" : "Ativar"}
              </Button>
              <Button variant="ghost" onClick={() => navigate({ to: "/admin/laboratorios" })}>Voltar</Button>
            </>
          }
        />

        <Card>
          <CardHeader><CardTitle className="text-base">Informações gerais</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Nome do laboratório" value={lab.name} />
              <Info label="Unidade/escola" value={lab.schoolName} />
              <Info label="Responsável" value={lab.responsible} />
              <Info label="Telefone" value={lab.phone} />
              <Info label="Cidade" value={lab.city} />
              <Info label="Estado" value={lab.state} />
              <Info label="Status" value={<StatusBadge status={lab.status} />} />
              <Info label="Computadores" value={`${lab.computerCount} PCs`} />
              <Info label="Data de cadastro" value={new Date(lab.createdAt).toLocaleDateString("pt-BR")} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Conta de acesso</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Info label="E-mail/login" value={accessEmail} />
            <Button asChild variant="outline">
              <Link to="/admin/laboratorios/$id/credenciais" params={{ id: lab.id }}>
                Gerenciar credenciais
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Horários do laboratório</CardTitle></CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum horário cadastrado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {schedules.map((schedule) => (
                  <Badge key={schedule.id} variant={schedule.active ? "secondary" : "outline"}>
                    {dayOfWeekLabels[schedule.dayOfWeek]}: {schedule.startTime}–{schedule.endTime}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-base font-semibold">Resumo de provas</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard title="Total de provas" value={examSummary.total} />
            <DashboardCard title="Pendentes" value={examSummary.pending} />
            <DashboardCard title="Aprovadas" value={examSummary.approved} />
            <DashboardCard title="Provas hoje" value={examSummary.today} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
