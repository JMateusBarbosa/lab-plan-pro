import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useCreateLaboratoryExamMutation,
  useLaboratoryExamQuery,
  useLaboratoryExamsQuery,
} from "@/lib/laboratory-exams-queries";
import { useLaboratorySessionQuery } from "@/lib/laboratory-session-queries";
import {
  canScheduleNextAttempt,
  findNextAttempt,
  getExamAttemptLabel,
  getNextAttemptLabel,
} from "@/lib/exam-lineage";
import { getLocalDateString } from "@/lib/date";
import { getDayOfWeekFromDate } from "@/types/laboratory-schedule";
import { buildComputerList } from "@/types/laboratory";

export const Route = createFileRoute("/laboratorio/provas/$id/proxima")({
  head: () => ({
    meta: [
      { title: "Agendar próxima tentativa — Agendamento de Provas" },
      { name: "description", content: "Agende a próxima tentativa de uma prova reprovada." },
    ],
  }),
  component: ProximaTentativa,
});

function ProximaTentativa() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useLaboratorySessionQuery();
  const { data: source, isLoading: loadingSource } = useLaboratoryExamQuery(id);
  const { data: exams = [], isLoading: loadingExams } = useLaboratoryExamsQuery();
  const createExam = useCreateLaboratoryExamMutation(session?.laboratory.id ?? "");

  const [examDate, setExamDate] = useState(getLocalDateString());
  const [studentClassTime, setStudentClassTime] = useState("");
  const [pcNumber, setPcNumber] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dayOfWeek = examDate ? getDayOfWeekFromDate(examDate) : null;
  const availableSchedules = useMemo(
    () =>
      dayOfWeek === null
        ? []
        : (session?.schedules ?? []).filter(
            (schedule) => schedule.active && schedule.dayOfWeek === dayOfWeek,
          ),
    [dayOfWeek, session?.schedules],
  );

  if (!session || loadingSource || loadingExams) {
    return <LaboratoryLayout><p className="text-sm text-muted-foreground">Carregando tentativa anterior...</p></LaboratoryLayout>;
  }

  if (!source) {
    return (
      <LaboratoryLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">A tentativa anterior não foi encontrada.</p>
          <Button asChild variant="outline"><Link to="/laboratorio/provas">Voltar para provas</Link></Button>
        </div>
      </LaboratoryLayout>
    );
  }

  const nextAttempt = findNextAttempt(exams, source.id);
  const canSchedule = canScheduleNextAttempt(exams, source);

  if (!canSchedule) {
    return (
      <LaboratoryLayout>
        <Card>
          <CardHeader><CardTitle className="text-base">Próxima tentativa indisponível</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {nextAttempt ? (
              <>
                <p>Esta tentativa já possui uma próxima tentativa agendada.</p>
                <Button asChild>
                  <Link to="/laboratorio/provas/$id" params={{ id: nextAttempt.id }}>
                    Ver {getExamAttemptLabel(exams, nextAttempt)}
                  </Link>
                </Button>
              </>
            ) : (
              <p>A próxima tentativa só pode ser agendada quando a tentativa atual estiver reprovada.</p>
            )}
            <Button asChild variant="outline">
              <Link to="/laboratorio/provas/$id" params={{ id: source.id }}>Voltar para a tentativa</Link>
            </Button>
          </CardContent>
        </Card>
      </LaboratoryLayout>
    );
  }

  const nextLabel = getNextAttemptLabel(exams, source);
  const computers = buildComputerList(session.laboratory.computerCount);

  const handleDateChange = (value: string) => {
    setExamDate(value);
    const nextDay = value ? getDayOfWeekFromDate(value) : null;
    const keepsTime = session.schedules.some(
      (schedule) =>
        schedule.active &&
        schedule.dayOfWeek === nextDay &&
        schedule.startTime === studentClassTime,
    );
    if (!keepsTime) setStudentClassTime("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (createExam.isPending) return;

    const nextErrors: Record<string, string> = {};
    if (!examDate) nextErrors.examDate = "Informe a data.";
    if (!studentClassTime) nextErrors.studentClassTime = "Selecione o horário.";
    if (!pcNumber) nextErrors.pcNumber = "Selecione o computador.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const hasConflict = exams.some(
      (exam) =>
        exam.examDate === examDate &&
        exam.studentClassTime === studentClassTime &&
        exam.pcNumber === pcNumber,
    );
    if (hasConflict) {
      toast.error("Este computador já está agendado para a mesma data e horário.");
      return;
    }

    try {
      const created = await createExam.mutateAsync({
        studentName: source.studentName,
        module: source.module,
        studentClassTime,
        examDate,
        pcNumber,
        examType: "recuperacao",
        status: "pendente",
        previousExamId: source.id,
      });
      toast.success(`${nextLabel} agendada com sucesso.`);
      navigate({ to: "/laboratorio/provas/$id", params: { id: created.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível agendar a próxima tentativa.");
    }
  };

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Agendar {nextLabel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aluno, módulo e origem já foram definidos pelo sistema. Escolha apenas quando e onde a próxima tentativa acontecerá.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Origem da próxima tentativa</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">Aluno</p><p className="font-medium">{source.studentName}</p></div>
            <div><p className="text-xs text-muted-foreground">Módulo</p><p className="font-medium">{source.module}</p></div>
            <div><p className="text-xs text-muted-foreground">Tentativa anterior</p><p className="font-medium">{getExamAttemptLabel(exams, source)}</p></div>
            <div><p className="text-xs text-muted-foreground">Resultado</p><p className="font-medium">Reprovado</p></div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Novo agendamento</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="next-date">Data *</Label>
                <Input id="next-date" type="date" value={examDate} onChange={(event) => handleDateChange(event.target.value)} disabled={createExam.isPending} />
                {errors.examDate ? <p className="text-xs text-destructive">{errors.examDate}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label>Horário *</Label>
                <Select disabled={createExam.isPending} value={studentClassTime} onValueChange={setStudentClassTime}>
                  <SelectTrigger><SelectValue placeholder="Selecione o horário" /></SelectTrigger>
                  <SelectContent>
                    {availableSchedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.startTime}>
                        {schedule.startTime} – {schedule.endTime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableSchedules.length === 0 ? <p className="text-xs text-muted-foreground">Não há horários ativos nesse dia.</p> : null}
                {errors.studentClassTime ? <p className="text-xs text-destructive">{errors.studentClassTime}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label>Computador *</Label>
                <Select disabled={createExam.isPending} value={pcNumber ? String(pcNumber) : ""} onValueChange={(value) => setPcNumber(Number(value))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o computador" /></SelectTrigger>
                  <SelectContent>
                    {computers.map((pc) => <SelectItem key={pc} value={String(pc)}>PC {pc}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.pcNumber ? <p className="text-xs text-destructive">{errors.pcNumber}</p> : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline" disabled={createExam.isPending}>
              <Link to="/laboratorio/provas/$id" params={{ id: source.id }}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={createExam.isPending}>
              {createExam.isPending ? "Agendando..." : `Agendar ${nextLabel}`}
            </Button>
          </div>
        </form>
      </div>
    </LaboratoryLayout>
  );
}
