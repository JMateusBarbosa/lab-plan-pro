import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminDashboardQuery } from "@/lib/admin-laboratories-queries";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Administrativo — Agendamento de Provas" },
      { name: "description", content: "Visão geral dos laboratórios e provas agendadas." },
      { property: "og:title", content: "Dashboard Administrativo" },
      { property: "og:description", content: "Visão geral dos laboratórios e provas agendadas." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useAdminDashboardQuery();

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
      </AdminLayout>
    );
  }

  if (isError || !data) {
    return (
      <AdminLayout>
        <div className="space-y-3">
          <p className="text-sm text-destructive">Não foi possível carregar o dashboard.</p>
          <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      </AdminLayout>
    );
  }

  const laboratories = data.laboratories.map((record) => record.laboratory);
  const ativos = laboratories.filter((lab) => lab.status === "ativo").length;
  const recentes = laboratories.slice(0, 3);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Acompanhe os laboratórios cadastrados e uma visão geral das provas agendadas."
          actions={
            <Button asChild>
              <Link to="/admin/laboratorios/novo">Cadastrar novo laboratório</Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Total de laboratórios" value={laboratories.length} />
          <DashboardCard title="Laboratórios ativos" value={ativos} />
          <DashboardCard title="Laboratórios inativos" value={laboratories.length - ativos} />
          <DashboardCard title="Provas agendadas" value={data.totalExams} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laboratórios recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum laboratório cadastrado.</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentes.map((lab) => (
                        <TableRow key={lab.id}>
                          <TableCell className="font-medium">{lab.name}</TableCell>
                          <TableCell>{lab.schoolName}</TableCell>
                          <TableCell>{lab.responsible || "—"}</TableCell>
                          <TableCell><StatusBadge status={lab.status} /></TableCell>
                          <TableCell className="space-x-2 text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link to="/admin/laboratorios/$id" params={{ id: lab.id }}>Visualizar</Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link to="/admin/laboratorios/$id/editar" params={{ id: lab.id }}>Editar</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <ul className="space-y-3 md:hidden">
                  {recentes.map((lab) => (
                    <li key={lab.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{lab.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{lab.schoolName}</p>
                          <p className="truncate text-sm text-muted-foreground">{lab.responsible || "—"}</p>
                        </div>
                        <StatusBadge status={lab.status} />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/admin/laboratorios/$id" params={{ id: lab.id }}>Visualizar</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/admin/laboratorios/$id/editar" params={{ id: lab.id }}>Editar</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
