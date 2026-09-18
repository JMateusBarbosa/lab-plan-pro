import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { ExamCard } from "@/components/ExamCard";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { ExamResultDialog } from "@/components/ExamResultDialog";
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
import { useLaboratorySessionQuery } from "@/lib/laboratory-session-queries";
import {
  useDeleteLaboratoryExamMutation,
  useLaboratoryExamsQuery,
} from "@/lib/laboratory-exams-queries";
import { getLocalDateString } from "@/lib/date";
import { buildComputerList } from "@/types/laboratory";
import type { Exam } from "@/types/exam";
import {
  canScheduleNextAttempt,
  findNextAttempt,
  getExamAttemptLabel,
} from "@/lib/exam-lineage";

export const Route = createFileRoute("/laboratorio/provas/")({
  head: () => ({
    meta: [
      { title: "Provas do Laboratório — Agendamento de Provas" },
      { name: "description", content: "Consulte e filtre as provas agendadas no laboratório." },
    ],
  }),
  component: ProvasLista,
});

const ALL = "todos";

function ProvasLista() {
  const { data: session } = useLaboratorySessionQuery();
  const { data: exams = [], isLoading, isError, refetch } = useLaboratoryExamsQuery();
  const deleteExam = useDeleteLaboratoryExamMutation();

  const [student, setStudent] = useState("");
  const [module, setModule] = useState("");
  const [pc, setPc] = useState(ALL);
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [toDelete, setToDelete] = useState<Exam | null>(null);

  const computers = buildComputerList(session?.laboratory.computerCount ?? 0);
  const times = Array.from(
    new Set((session?.schedules ?? []).filter((schedule) => schedule.active).map((schedule) => schedule.startTime)),
  ).sort();

  const filtered = useMemo(
    () =>
      exams.filter((exam) => {
        if (student && !exam.studentName.toLowerCase().includes(student.toLowerCase())) return false;
        if (module && !exam.module.toLowerCase().includes(module.toLowerCase())) return false;
        if (pc !== ALL && exam.pcNumber !== Number(pc)) return false;
        if (date && exam.examDate !== date) return false;
        if (time !== ALL && exam.studentClassTime !== time) return false;
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

  const confirmDelete = async () => {
    if (!toDelete || deleteExam.isPending) return;

    try {
      await deleteExam.mutateAsync(toDelete.id);
      toast.success("Prova excluída com sucesso.");
      setToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir a prova.");
    }
  };

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Provas</h1>
          <Button asChild><Link to="/laboratorio/provas/nova">Agendar prova</Link></Button>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="f-student">Nome do aluno</Label>
              <Input id="f-student" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Buscar aluno" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-module">Módulo</Label>
              <Input id="f-module" value={module} onChange={(e) => setModule(e.target.value)} placeholder="Buscar módulo" />
            </div>
            <div className="space-y-1.5">
              <Label>Computador</Label>
              <Select value={pc} onValueChange={setPc}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {computers.map((number) => <SelectItem key={number} value={String(number)}>PC {number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-date">Data</Label>
              <Input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Horário da aula</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {times.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="p1">P1</SelectItem>
                  <SelectItem value="recuperacao">Recuperação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button variant="outline" onClick={clearFilters}>Limpar filtros</Button></div>
          </CardContent>
        </Card>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando provas...</p> : null}
        {isError ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-destructive">Não foi possível carregar as provas.</p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>Tentar novamente</Button>
          </div>
        ) : null}

        {!isLoading && !isError && filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma prova encontrada.</p>
        ) : null}

        {!isLoading && !isError && filtered.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto rounded-md border bg-background md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário da aula</TableHead>
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
                      <TableCell>{exam.studentClassTime}</TableCell>
                      <TableCell>PC {exam.pcNumber}</TableCell>
                      <TableCell>{getExamAttemptLabel(exams, exam)}</TableCell>
                      <TableCell><ExamStatusBadge status={exam.status} /></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <ExamResultDialog exam={exam} exams={exams} />
                          {canScheduleNextAttempt(exams, exam) ? (
                            <Button asChild size="sm">
                              <Link to="/laboratorio/provas/$id/proxima" params={{ id: exam.id }}>Próxima tentativa</Link>
                            </Button>
                          ) : null}
                          {findNextAttempt(exams, exam.id) ? (
                            <Button asChild size="sm" variant="outline">
                              <Link to="/laboratorio/provas/$id" params={{ id: findNextAttempt(exams, exam.id)!.id }}>Ver próxima</Link>
                            </Button>
                          ) : null}
                          <Button asChild size="sm" variant="outline"><Link to="/laboratorio/provas/$id" params={{ id: exam.id }}>Ver</Link></Button>
                          <Button asChild size="sm" variant="outline"><Link to="/laboratorio/provas/$id/editar" params={{ id: exam.id }}>Editar dados</Link></Button>
                          <Button size="sm" variant="destructive" disabled={deleteExam.isPending} onClick={() => setToDelete(exam)}>Excluir</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 md:hidden">
              {filtered.map((exam) => <ExamCard key={exam.id} exam={exam} exams={exams} onDelete={setToDelete} />)}
            </div>
          </>
        ) : null}
      </div>

      <ConfirmationDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && !deleteExam.isPending && setToDelete(null)}
        title="Excluir prova"
        description={toDelete ? `A prova de ${toDelete.studentName} será removida.` : undefined}
        confirmLabel={deleteExam.isPending ? "Excluindo..." : "Excluir"}
        onConfirm={() => void confirmDelete()}
      />
    </LaboratoryLayout>
  );
}
