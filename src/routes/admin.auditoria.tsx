import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AdminLayout } from "@/layouts/AdminLayout";
import type { AuditLogRecord } from "@/lib/admin-audit-api";
import {
  useAdminAuditLaboratoriesQuery,
  useAdminAuditQuery,
} from "@/lib/admin-audit-queries";

export const Route = createFileRoute("/admin/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — Agendamento de Provas" },
      { name: "description", content: "Histórico de alterações administrativas e operacionais." },
    ],
  }),
  component: AdminAuditPage,
});

const PAGE_SIZE = 20;

const actionLabels: Record<string, string> = {
  insert: "Criação",
  update: "Atualização",
  soft_delete: "Exclusão",
  restore: "Restauração",
  admin_update: "Atualização administrativa",
  status_change: "Alteração de status",
  provision: "Provisionamento",
};

const entityLabels: Record<string, string> = {
  exam: "Prova",
  laboratory: "Laboratório",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Manaus",
  }).format(new Date(value));
}

function JsonBlock({ value, empty }: { value: unknown; empty: string }) {
  if (value == null) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("todos");
  const [entityType, setEntityType] = useState("todos");
  const [laboratoryId, setLaboratoryId] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      action: action === "todos" ? undefined : action,
      entityType: entityType === "todos" ? undefined : entityType,
      laboratoryId: laboratoryId === "todos" ? undefined : laboratoryId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [action, endDate, entityType, laboratoryId, page, startDate],
  );

  const { data, isLoading, isError, refetch } = useAdminAuditQuery(filters);
  const { data: laboratories = [] } = useAdminAuditLaboratoriesQuery();
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setAction("todos");
    setEntityType("todos");
    setLaboratoryId("todos");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Auditoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico imutável das alterações registradas pelo sistema.
          </p>
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
            <Select value={action} onValueChange={(value) => { setAction(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as ações</SelectItem>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityType} onValueChange={(value) => { setEntityType(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Entidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as entidades</SelectItem>
                <SelectItem value="exam">Prova</SelectItem>
                <SelectItem value="laboratory">Laboratório</SelectItem>
              </SelectContent>
            </Select>

            <Select value={laboratoryId} onValueChange={(value) => { setLaboratoryId(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Laboratório" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os laboratórios</SelectItem>
                {laboratories.map(({ laboratory }) => (
                  <SelectItem key={laboratory.id} value={laboratory.id}>{laboratory.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); resetPage(); }} aria-label="Data inicial" />
            <Input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); resetPage(); }} aria-label="Data final" />
            <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
          </CardContent>
        </Card>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando eventos...</p> : null}
        {isError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-destructive">Não foi possível carregar a auditoria.</p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
          </div>
        ) : null}

        {!isLoading && !isError && (data?.records.length ?? 0) === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhum evento encontrado para os filtros selecionados.</CardContent></Card>
        ) : null}

        {!isLoading && !isError && data && data.records.length > 0 ? (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Laboratório</TableHead>
                    <TableHead>Ator</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(record.createdAt)}</TableCell>
                      <TableCell><Badge variant="secondary">{actionLabels[record.action] ?? record.action}</Badge></TableCell>
                      <TableCell>{entityLabels[record.entityType] ?? record.entityType}</TableCell>
                      <TableCell>{record.laboratoryName ?? "—"}</TableCell>
                      <TableCell>{record.actorRole === "admin" ? "Administrador" : record.actorRole === "laboratory" ? "Laboratório" : "Sistema"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelected(record)}>Visualizar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && data ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data.total} evento{data.total === 1 ? "" : "s"} · Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Próxima</Button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do evento</DialogTitle>
            <DialogDescription>
              {selected ? `${actionLabels[selected.action] ?? selected.action} · ${formatDateTime(selected.createdAt)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Antes</h3>
                <JsonBlock value={selected.beforeData} empty="Não há estado anterior para este evento." />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Depois</h3>
                <JsonBlock value={selected.afterData} empty="Não há estado posterior para este evento." />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
