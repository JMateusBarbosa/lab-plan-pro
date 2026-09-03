import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/layouts/AdminLayout";
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
import { mockDashboardStats } from "@/data/laboratories";
import { useLaboratories } from "@/lib/laboratories-store";

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
  const { laboratories } = useLaboratories();
  const ativos = laboratories.filter((l) => l.status === "ativo").length;
  const recentes = laboratories.slice(0, 3);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          <Button asChild>
            <Link to="/admin/laboratorios/novo">Cadastrar novo laboratório</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Total de laboratórios" value={laboratories.length} />
          <DashboardCard title="Laboratórios ativos" value={ativos} />
          <DashboardCard title="Laboratórios inativos" value={laboratories.length - ativos} />
          <DashboardCard
            title="Provas agendadas"
            value={mockDashboardStats.provasAgendadas}
            description="Dados fictícios"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laboratórios recentes</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <TableCell>
                        <StatusBadge status={lab.status} />
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/admin/laboratorios/$id" params={{ id: lab.id }}>
                            Visualizar
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/admin/laboratorios/$id/editar" params={{ id: lab.id }}>
                            Editar
                          </Link>
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
                      <p className="truncate text-sm text-muted-foreground">
                        {lab.responsible || "—"}
                      </p>
                    </div>
                    <StatusBadge status={lab.status} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/laboratorios/$id" params={{ id: lab.id }}>
                        Visualizar
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/laboratorios/$id/editar" params={{ id: lab.id }}>
                        Editar
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
