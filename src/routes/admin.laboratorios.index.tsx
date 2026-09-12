import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/layouts/AdminLayout";
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
import { useLaboratories } from "@/lib/laboratories-store";
import { useLaboratoryAccess } from "@/lib/laboratory-access-store";

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

function LaboratoriosPage() {
  const { laboratories, toggleStatus } = useLaboratories();
  const { getByLaboratoryId } = useLaboratoryAccess();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | "ativo" | "inativo">("todos");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return laboratories.filter((lab) => {
      const matchStatus = status === "todos" || lab.status === status;
      const email = getByLaboratoryId(lab.id)?.email ?? "";
      const matchTerm =
        !term ||
        [lab.name, lab.schoolName, lab.responsible, email].some((value) =>
          value.toLowerCase().includes(term),
        );
      return matchStatus && matchTerm;
    });
  }, [laboratories, search, status, getByLaboratoryId]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Laboratórios</h1>
          <Button asChild>
            <Link to="/admin/laboratorios/novo">Novo laboratório</Link>
          </Button>
        </div>

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

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum laboratório encontrado.</p>
        ) : null}

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
                  {filtered.map((lab) => {
                    const email = getByLaboratoryId(lab.id)?.email ?? "—";
                    return (
                      <TableRow key={lab.id}>
                        <TableCell className="font-medium">{lab.name}</TableCell>
                        <TableCell>{lab.schoolName}</TableCell>
                        <TableCell>{lab.responsible || "—"}</TableCell>
                        <TableCell>{email}</TableCell>
                        <TableCell>{lab.city}</TableCell>
                        <TableCell>{lab.state}</TableCell>
                        <TableCell>
                          <StatusBadge status={lab.status} />
                        </TableCell>
                        <TableCell>{lab.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
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
                            <Button size="sm" variant="outline" onClick={() => toggleStatus(lab.id)}>
                              {lab.status === "ativo" ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
          {filtered.map((lab) => (
            <LaboratoryCard
              key={lab.id}
              laboratory={lab}
              accessEmail={getByLaboratoryId(lab.id)?.email}
              onToggleStatus={toggleStatus}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
