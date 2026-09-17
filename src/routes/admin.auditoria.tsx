import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import {
  listAllFilteredAuditLogs,
  type AuditLogRecord,
} from "@/lib/admin-audit-api";
import {
  useAdminAuditActorsQuery,
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

const fieldLabels: Record<string, string> = {
  id: "ID",
  student_name: "Aluno",
  module: "Módulo",
  pc_number: "Computador",
  exam_date: "Data da prova",
  student_class_time: "Horário",
  exam_type: "Tipo de prova",
  status: "Status",
  previous_exam_id: "Prova anterior",
  laboratory_id: "Laboratório",
  name: "Nome",
  school_name: "Escola",
  city: "Cidade",
  state: "UF",
  responsible: "Responsável",
  phone: "Telefone",
  computer_count: "Computadores",
  deleted_at: "Excluída em",
  deleted_by: "Excluída por",
  created_at: "Criado em",
  updated_at: "Atualizado em",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Manaus",
  }).format(new Date(value));
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function formatValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function changedFields(record: AuditLogRecord) {
  const before = toObject(record.beforeData) ?? {};
  const after = toObject(record.afterData) ?? {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({
      key,
      label: fieldLabels[key] ?? key,
      before: before[key],
      after: after[key],
    }));
}

function csvCell(value: unknown) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function AuditDiff({ record }: { record: AuditLogRecord }) {
  const changes = changedFields(record);

  if (changes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma alteração de campo foi identificada neste evento.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campo</TableHead>
            <TableHead>Antes</TableHead>
            <TableHead>Depois</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => (
            <TableRow key={change.key}>
              <TableCell className="font-medium">{change.label}</TableCell>
              <TableCell className="max-w-64 break-words text-sm text-muted-foreground">{formatValue(change.before)}</TableCell>
              <TableCell className="max-w-64 break-words text-sm">{formatValue(change.after)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("todos");
  const [entityType, setEntityType] = useState("todos");
  const [laboratoryId, setLaboratoryId] = useState("todos");
  const [actorUserId, setActorUserId] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      action: action === "todos" ? undefined : action,
      entityType: entityType === "todos" ? undefined : entityType,
      laboratoryId: laboratoryId === "todos" ? undefined : laboratoryId,
      actorUserId: actorUserId === "todos" ? undefined : actorUserId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search || undefined,
    }),
    [action, actorUserId, endDate, entityType, laboratoryId, page, search, startDate],
  );

  const { data, isLoading, isError, refetch } = useAdminAuditQuery(filters);
  const { data: laboratories = [] } = useAdminAuditLaboratoriesQuery();
  const { data: actors = [] } = useAdminAuditActorsQuery();
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setAction("todos");
    setEntityType("todos");
    setLaboratoryId("todos");
    setActorUserId("todos");
    setStartDate("");
    setEndDate("");
    setSearchDraft("");
    setSearch("");
    setPage(1);
    setExportMessage(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const { records, total, truncated } = await listAllFilteredAuditLogs({
        action: filters.action,
        entityType: filters.entityType,
        laboratoryId: filters.laboratoryId,
        actorUserId: filters.actorUserId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
      });

      const header = ["Data/Hora", "Ação", "Entidade", "Laboratório", "Ator", "Papel", "ID da entidade", "Antes", "Depois"];
      const rows = records.map((record) => [
        formatDateTime(record.createdAt),
        actionLabels[record.action] ?? record.action,
        entityLabels[record.entityType] ?? record.entityType,
        record.laboratoryName ?? "",
        record.actorEmail ?? record.actorUserId ?? "Sistema",
        record.actorRole ?? "",
        record.entityId ?? "",
        record.beforeData,
        record.afterData,
      ]);

      const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
      downloadCsv(`auditoria-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setExportMessage(
        truncated
          ? `Foram exportados os primeiros ${records.length} de ${total} eventos.`
          : `${records.length} evento${records.length === 1 ? "" : "s"} exportado${records.length === 1 ? "" : "s"}.`,
      );
    } catch {
      setExportMessage("Não foi possível exportar a auditoria.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Auditoria</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Histórico imutável das alterações registradas pelo sistema.
            </p>
          </div>
          <Button variant="outline" onClick={() => void handleExport()} disabled={isExporting || !data?.total}>
            {isExporting ? "Exportando..." : "Exportar CSV"}
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar aluno, módulo, e-mail, ID..."
              aria-label="Buscar na auditoria"
            />

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

            <Select value={actorUserId} onValueChange={(value) => { setActorUserId(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Ator" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os atores</SelectItem>
                {actors.map((actor) => (
                  <SelectItem key={actor.id} value={actor.id}>
                    {actor.email} · {actor.role === "admin" ? "Admin" : "Laboratório"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); resetPage(); }} aria-label="Data inicial" />
            <Input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); resetPage(); }} aria-label="Data final" />
            <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
          </CardContent>
        </Card>

        {exportMessage ? <p className="text-sm text-muted-foreground">{exportMessage}</p> : null}
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
                      <TableCell className="max-w-56 truncate" title={record.actorEmail ?? undefined}>
                        {record.actorEmail ?? (record.actorRole === "admin" ? "Administrador" : record.actorRole === "laboratory" ? "Laboratório" : "Sistema")}
                      </TableCell>
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do evento</DialogTitle>
            <DialogDescription>
              {selected ? `${actionLabels[selected.action] ?? selected.action} · ${formatDateTime(selected.createdAt)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-md border p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><span className="text-muted-foreground">Entidade</span><p className="font-medium">{entityLabels[selected.entityType] ?? selected.entityType}</p></div>
                <div><span className="text-muted-foreground">Ator</span><p className="break-all font-medium">{selected.actorEmail ?? selected.actorUserId ?? "Sistema"}</p></div>
                <div><span className="text-muted-foreground">Laboratório</span><p className="font-medium">{selected.laboratoryName ?? "—"}</p></div>
                <div><span className="text-muted-foreground">ID da entidade</span><p className="break-all font-mono text-xs">{selected.entityId ?? "—"}</p></div>
              </div>

              {selected.laboratoryId ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/laboratorios/$id" params={{ id: selected.laboratoryId }}>
                    Abrir laboratório relacionado
                  </Link>
                </Button>
              ) : null}

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Alterações</h3>
                <AuditDiff record={selected} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
