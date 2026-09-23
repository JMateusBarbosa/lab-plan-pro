import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { LaboratoryCard } from "@/components/LaboratoryCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminLaboratoriesQuery,
  useToggleLaboratoryStatusMutation,
} from "@/lib/admin-laboratories-queries";
import type { Laboratory } from "@/types/laboratory";

export const Route = createFileRoute("/admin/laboratorios/")({
  head: () => ({
    meta: [
      { title: "Laboratórios — Agendamento de Provas" },
      { name: "description", content: "Lista e gerenciamento dos laboratórios cadastrados." },
      { property: "og:title", content: "Laboratórios" },
      { property: "og:description", content: "Lista e gerenciamento dos laboratórios cadastrados." },
    ],
  }),
  component: LaboratoriosPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function LaboratoriosPage() {
  const { data: records = [], isLoading, isError, refetch } = useAdminLaboratoriesQuery();
  const toggleStatus = useToggleLaboratoryStatusMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | "ativo" | "inativo">("todos");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter(({ laboratory, accessEmail }) => {
      const matchStatus = status === "todos" || laboratory.status === status;
      const matchTerm =
        !term ||
        [laboratory.name, laboratory.schoolName, laboratory.responsible, accessEmail].some((value) =>
          value.toLowerCase().includes(term),
        );
      return matchStatus && matchTerm;
    });
  }, [records, search, status]);

  const handleToggleStatus = async (laboratory: Laboratory) => {
    if (toggleStatus.isPending) return;

    try {
      await toggleStatus.mutateAsync({ id: laboratory.id, currentStatus: laboratory.status });
      toast.success(laboratory.status === "ativo" ? "Laboratório desativado." : "Laboratório ativado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível alterar o status.";
      toast.error(message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Laboratórios"
          description="Consulte, filtre e gerencie os laboratórios vinculados ao sistema."
          actions={
            <Button asChild>
              <Link to="/admin/laboratorios/novo">Novo laboratório</Link>
            </Button>
          }
        />

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
            <Input
              placeholder="Buscar por nome, unidade, responsável ou e-mail"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-md"
            />
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando laboratórios...</p> : null}
        {isError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-destructive">Não foi possível carregar os laboratórios.</p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : null}
        {!isLoading && !isError && filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum laboratório encontrado.</p>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="hidden lg:block">
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Unidade/Escola</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(({ laboratory: lab, accessEmail }) => (
                        <TableRow key={lab.id}>
                          <TableCell className="font-medium">{lab.name}</TableCell>
                          <TableCell>{lab.schoolName}</TableCell>
                          <TableCell>{lab.responsible || "—"}</TableCell>
                          <TableCell>{accessEmail || "—"}</TableCell>
                          <TableCell>{lab.city}</TableCell>
                          <TableCell>{lab.state}</TableCell>
                          <TableCell><StatusBadge status={lab.status} /></TableCell>
                          <TableCell>{formatDate(lab.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link to="/admin/laboratorios/$id" params={{ id: lab.id }}>Visualizar</Link>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <Link to="/admin/laboratorios/$id/editar" params={{ id: lab.id }}>Editar</Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={toggleStatus.isPending}
                                onClick={() => void handleToggleStatus(lab)}
                              >
                                {lab.status === "ativo" ? "Desativar" : "Ativar"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {filtered.map(({ laboratory: lab, accessEmail }) => (
                <LaboratoryCard
                  key={lab.id}
                  laboratory={lab}
                  accessEmail={accessEmail}
                  onToggleStatus={() => void handleToggleStatus(lab)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
