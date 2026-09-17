import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, RotateCcw, Search } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useAdminAuditFilterOptionsQuery,
  useAdminAuditQuery,
} from "@/lib/admin-audit-queries";
import type { AuditLogItem } from "@/types/audit";

const PAGE_SIZE = 20;
const BUSINESS_TIME_ZONE = "America/Manaus";

const actionLabels: Record<string, string> = {
  insert: "Criação",
  update: "Atualização",
  soft_delete: "Exclusão lógica",
  restore: "Restauração",
  admin_update: "Alteração administrativa",
  status_change: "Alteração de status",
  provision: "Provisionamento",
};

const entityLabels: Record<string, string> = {
  exam: "Prova",
  laboratory: "Laboratório",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BUSINESS_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatJson(value: unknown) {
  return value == null ? "Sem dados" : JSON.stringify(value, null, 2);
}

export const Route = createFileRoute("/admin/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — Administração" },
      {
        name: "description",
        content: "Histórico de alterações e operações administrativas do sistema.",
      },
    ],
  }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [laboratoryId, setLaboratoryId] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      from: from || undefined,
      to: to || undefined,
      laboratoryId: laboratoryId || undefined,
      actorUserId: actorUserId || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
    }),
    [action, actorUserId, entityType, from, laboratoryId, page, to],
  );

  const auditQuery = useAdminAuditQuery(filters);
  const optionsQuery = useAdminAuditFilterOptionsQuery();

  const changeFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setLaboratoryId("");
    setActorUserId("");
    setAction("");
    setEntityType("");
    setPage(1);
  };

  const data = auditQuery.data;
  const options = optionsQuery.data;
  const hasFilters = Boolean(from || to || laboratoryId || actorUserId || action || entityType);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Auditoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico somente leitura das alterações relevantes realizadas no sistema.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="audit-from">Data inicial</label>
                <Input
                  id="audit-from"
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => changeFilter(setFrom, event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="audit-to">Data final</label>
                <Input
                  id="audit-to"
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => changeFilter(setTo, event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Laboratório</label>
                <Select
                  value={laboratoryId || "all"}
                  onValueChange={(value) => changeFilter(setLaboratoryId, value === "all" ? "" : value)}
                  disabled={optionsQuery.isLoading}
                >
                  <SelectTrigger><SelectValue placeholder="Todos os laboratórios" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os laboratórios</SelectItem>
                    {(options?.laboratories ?? []).map((laboratory) => (
                      <SelectItem key={laboratory.id} value={laboratory.id}>{laboratory.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Usuário</label>
                <Select
                  value={actorUserId || "all"}
                  onValueChange={(value) => changeFilter(setActorUserId, value === "all" ? "" : value)}
                  disabled={optionsQuery.isLoading}
                >
                  <SelectTrigger><SelectValue placeholder="Todos os usuários" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {(options?.actors ?? []).map((actor) => (
                      <SelectItem key={actor.id} value={actor.id}>
                        {actor.email} ({actor.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ação</label>
                <Select
                  value={action || "all"}
                  onValueChange={(value) => changeFilter(setAction, value === "all" ? "" : value)}
                >
                  <SelectTrigger><SelectValue placeholder="Todas as ações" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {(options?.actions ?? []).map((item) => (
                      <SelectItem key={item} value={item}>{actionLabels[item] ?? item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Entidade</label>
                <Select
                  value={entityType || "all"}
                  onValueChange={(value) => changeFilter(setEntityType, value === "all" ? "" : value)}
                >
                  <SelectTrigger><SelectValue placeholder="Todas as entidades" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as entidades</SelectItem>
                    {(options?.entityTypes ?? []).map((item) => (
                      <SelectItem key={item} value={item}>{entityLabels[item] ?? item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {data ? `${data.total} evento${data.total === 1 ? "" : "s"} encontrado${data.total === 1 ? "" : "s"}` : ""}
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Eventos registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {auditQuery.isLoading && !data ? (
              <p className="text-sm text-muted-foreground">Carregando auditoria...</p>
            ) : auditQuery.isError ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">Não foi possível carregar os registros de auditoria.</p>
                <Button variant="outline" size="sm" onClick={() => void auditQuery.refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="font-medium">Nenhum evento encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasFilters
                    ? "Tente alterar ou limpar os filtros aplicados."
                    : "Os eventos aparecerão aqui conforme alterações auditáveis forem realizadas."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data e hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Laboratório</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead className="text-right">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                          <TableCell className="max-w-56 truncate">{log.actorEmail ?? log.actorRole ?? "Sistema"}</TableCell>
                          <TableCell className="max-w-48 truncate">{log.laboratoryName ?? "—"}</TableCell>
                          <TableCell><Badge variant="secondary">{actionLabels[log.action] ?? log.action}</Badge></TableCell>
                          <TableCell>{entityLabels[log.entityType] ?? log.entityType}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                              <Eye className="mr-2 h-4 w-4" />Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 lg:hidden">
                  {data.items.map((log) => (
                    <article key={log.id} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{entityLabels[log.entityType] ?? log.entityType}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                        </div>
                        <Badge variant="secondary">{actionLabels[log.action] ?? log.action}</Badge>
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div><dt className="text-muted-foreground">Usuário</dt><dd className="break-all">{log.actorEmail ?? log.actorRole ?? "Sistema"}</dd></div>
                        <div><dt className="text-muted-foreground">Laboratório</dt><dd>{log.laboratoryName ?? "—"}</dd></div>
                      </dl>
                      <Button className="mt-3" variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                        <Eye className="mr-2 h-4 w-4" />Ver detalhes
                      </Button>
                    </article>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {data.page} de {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1 || auditQuery.isFetching}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages || auditQuery.isFetching}
                      onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do evento</DialogTitle>
            <DialogDescription>
              Registro imutável da operação selecionada.
            </DialogDescription>
          </DialogHeader>

          {selectedLog ? (
            <div className="space-y-5">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Data e hora</dt><dd>{formatDateTime(selectedLog.createdAt)}</dd></div>
                <div><dt className="text-muted-foreground">Ação</dt><dd>{actionLabels[selectedLog.action] ?? selectedLog.action}</dd></div>
                <div><dt className="text-muted-foreground">Usuário</dt><dd className="break-all">{selectedLog.actorEmail ?? selectedLog.actorRole ?? "Sistema"}</dd></div>
                <div><dt className="text-muted-foreground">Laboratório</dt><dd>{selectedLog.laboratoryName ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Entidade</dt><dd>{entityLabels[selectedLog.entityType] ?? selectedLog.entityType}</dd></div>
                <div><dt className="text-muted-foreground">ID da entidade</dt><dd className="break-all font-mono text-xs">{selectedLog.entityId ?? "—"}</dd></div>
              </dl>

              <div className="grid gap-4 xl:grid-cols-2">
                <AuditJsonBlock title="Antes" value={selectedLog.beforeData} />
                <AuditJsonBlock title="Depois" value={selectedLog.afterData} />
              </div>
              <AuditJsonBlock title="Metadados" value={selectedLog.metadata} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function AuditJsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-all">
        {formatJson(value)}
      </pre>
    </section>
  );
}
