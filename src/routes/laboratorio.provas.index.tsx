import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { ExamCard } from "@/components/ExamCard";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCurrentLaboratory, CURRENT_LABORATORY_ID } from "@/lib/laboratories-store";
import { useExams } from "@/lib/exams-store";
import { getLocalDateString } from "@/lib/date";
import { buildComputerList } from "@/types/laboratory";
import { examTypeLabels, type Exam } from "@/types/exam";

export const Route = createFileRoute("/laboratorio/provas/")({
  head: () => ({
    meta: [
      { title: "Provas do Laboratório — Agendamento de Provas" },
      { name: "description", content: "Consulte e filtre as provas agendadas no laboratório." },
      { property: "og:title", content: "Provas do Laboratório" },
      {
        property: "og:description",
        content: "Consulte e filtre as provas agendadas no laboratório.",
      },
    ],
  }),
  component: ProvasLista,
});

const ALL = "todos";

function ProvasLista() {
  const lab = useCurrentLaboratory();
  const { listByLaboratory, remove } = useExams();
  const exams = listByLaboratory(CURRENT_LABORATORY_ID);

  const [student, setStudent] = useState("");
  const [module, setModule] = useState("");
  const [pc, setPc] = useState(ALL);
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [toDelete, setToDelete] = useState<Exam | null>(null);

  const computers = buildComputerList(lab?.computerCount ?? 0);

  const filtered = useMemo(
    () =>
      exams.filter((exam) => {
        if (student && !exam.studentName.toLowerCase().includes(student.toLowerCase()))
          return false;
        if (module && !exam.module.toLowerCase().includes(module.toLowerCase())) return false;
        if (pc !== ALL && exam.pcNumber !== Number(pc)) return false;
        if (date && exam.examDate !== date) return false;
        if (time !== ALL && exam.examTime !== time) return false;
        if (type !== ALL && exam.examType !== type) return false;
        if (status !== ALL && exam.status !== status) return false;
        return true;
      }),
    [exams, student, module, pc, date, time, type, status],
  );

  const clearFilters = () => {
    setStudent("");
    setModule("");
    setPc(ALL);
    setDate("");
    setTime(ALL);
    setType(ALL);
    setStatus(ALL);
  };

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Provas</h1>
          <Button asChild>
            <Link to="/laboratorio/provas/nova">Agendar prova</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="f-student">Nome do aluno</Label>
              <Input
                id="f-student"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                placeholder="Buscar aluno"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-module">Módulo</Label>
              <Input
                id="f-module"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="Buscar módulo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Computador</Label>
              <Select value={pc} onValueChange={setPc}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {computers.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      PC {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-date">Data</Label>
              <Input
                id="f-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {(lab?.availableTimes ?? []).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="REC1">Recuperação 1</SelectItem>
                  <SelectItem value="REC2">Recuperação 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma prova encontrada.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-md border bg-background md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>PC</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>{exam.studentName}</TableCell>
                      <TableCell>{exam.module}</TableCell>
                      <TableCell>{exam.examDate}</TableCell>
                      <TableCell>{exam.examTime}</TableCell>
                      <TableCell>PC {exam.pcNumber}</TableCell>
                      <TableCell>{examTypeLabels[exam.examType]}</TableCell>
                      <TableCell>
                        <ExamStatusBadge status={exam.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/laboratorio/provas/$id" params={{ id: exam.id }}>
                              Ver
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to="/laboratorio/provas/$id/editar" params={{ id: exam.id }}>
                              Editar
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setToDelete(exam)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 md:hidden">
              {filtered.map((exam) => (
                <ExamCard key={exam.id} exam={exam} onDelete={setToDelete} />
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmationDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Excluir prova"
        description={
          toDelete ? `A prova de ${toDelete.studentName} será removida.` : undefined
        }
        confirmLabel="Excluir"
        onConfirm={() => {
          if (toDelete) {
            remove(toDelete.id);
            toast.success("Prova excluída com sucesso.");
          }
          setToDelete(null);
        }}
      />
    </LaboratoryLayout>
  );
}
