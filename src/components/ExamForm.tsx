import { useMemo, useState, type FormEvent } from "react";
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
import { examStatusLabels, examTypeLabels, type Exam, type ExamFormValues } from "@/types/exam";
import { buildComputerList, type Laboratory } from "@/types/laboratory";
import { getDayOfWeekFromDate, type LaboratorySchedule } from "@/types/laboratory-schedule";
import { getLocalDateString } from "@/lib/date";

interface ExamFormProps {
  mode: "create" | "edit";
  laboratory: Laboratory;
  schedules: LaboratorySchedule[];
  previousExamOptions: Exam[];
  initialValues?: Partial<ExamFormValues>;
  onSubmit: (values: ExamFormValues) => void;
  onCancel: () => void;
}

const emptyValues: ExamFormValues = {
  studentName: "",
  module: "",
  studentClassTime: "",
  examDate: getLocalDateString(),
  pcNumber: 0,
  examType: "p1",
  status: "pendente",
  previousExamId: null,
};

export function ExamForm({
  mode,
  laboratory,
  schedules,
  previousExamOptions,
  initialValues,
  onSubmit,
  onCancel,
}: ExamFormProps) {
  const [values, setValues] = useState<ExamFormValues>({ ...emptyValues, ...initialValues });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const computers = buildComputerList(laboratory.computerCount);
  const dayOfWeek = values.examDate ? getDayOfWeekFromDate(values.examDate) : null;
  const availableSchedules = useMemo(
    () =>
      dayOfWeek === null
        ? []
        : schedules.filter((schedule) => schedule.active && schedule.dayOfWeek === dayOfWeek),
    [schedules, dayOfWeek],
  );

  const handleDateChange = (examDate: string) => {
    const nextDay = examDate ? getDayOfWeekFromDate(examDate) : null;
    const stillValid = schedules.some(
      (schedule) =>
        schedule.active &&
        schedule.dayOfWeek === nextDay &&
        schedule.startTime === values.studentClassTime,
    );
    setValues((prev) => ({
      ...prev,
      examDate,
      studentClassTime: stillValid ? prev.studentClassTime : "",
    }));
  };

  const handleTypeChange = (examType: ExamFormValues["examType"]) => {
    setValues((prev) => ({
      ...prev,
      examType,
      previousExamId: examType === "recuperacao" ? prev.previousExamId : null,
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.studentName.trim()) nextErrors.studentName = "Informe o nome do aluno.";
    if (!values.module.trim()) nextErrors.module = "Informe o módulo.";
    if (!values.examDate) nextErrors.examDate = "Informe a data da prova.";
    if (!values.pcNumber) nextErrors.pcNumber = "Selecione o computador.";
    if (!values.studentClassTime) nextErrors.studentClassTime = "Selecione o horário da aula.";
    if (values.examType === "recuperacao" && !values.previousExamId) {
      nextErrors.previousExamId = "Selecione a prova anterior que originou esta recuperação.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Dados da prova</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="studentName">Nome do aluno *</Label>
            <Input id="studentName" value={values.studentName} onChange={(e) => setValues((p) => ({ ...p, studentName: e.target.value }))} />
            {errors.studentName ? <p className="text-xs text-destructive">{errors.studentName}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="module">Módulo *</Label>
            <Input id="module" value={values.module} onChange={(e) => setValues((p) => ({ ...p, module: e.target.value }))} />
            {errors.module ? <p className="text-xs text-destructive">{errors.module}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="examDate">Data da prova *</Label>
            <Input id="examDate" type="date" value={values.examDate} onChange={(e) => handleDateChange(e.target.value)} />
            {errors.examDate ? <p className="text-xs text-destructive">{errors.examDate}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Horário da aula *</Label>
            <Select value={values.studentClassTime} onValueChange={(v) => setValues((p) => ({ ...p, studentClassTime: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o horário" /></SelectTrigger>
              <SelectContent>
                {availableSchedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.startTime}>
                    {schedule.startTime} – {schedule.endTime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableSchedules.length === 0 ? (
              <p className="text-xs text-muted-foreground">Não há horários ativos cadastrados para o dia da semana escolhido.</p>
            ) : null}
            {errors.studentClassTime ? <p className="text-xs text-destructive">{errors.studentClassTime}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Computador *</Label>
            <Select value={values.pcNumber ? String(values.pcNumber) : ""} onValueChange={(v) => setValues((p) => ({ ...p, pcNumber: Number(v) }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o computador" /></SelectTrigger>
              <SelectContent>
                {computers.map((pc) => <SelectItem key={pc} value={String(pc)}>PC {pc}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.pcNumber ? <p className="text-xs text-destructive">{errors.pcNumber}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo da prova *</Label>
            <Select value={values.examType} onValueChange={(v) => handleTypeChange(v as ExamFormValues["examType"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(examTypeLabels) as Array<keyof typeof examTypeLabels>).map((type) => (
                  <SelectItem key={type} value={type}>{examTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {values.examType === "recuperacao" ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Prova anterior *</Label>
              <Select
                value={values.previousExamId ?? ""}
                onValueChange={(value) => {
                  const previous = previousExamOptions.find((exam) => exam.id === value);
                  setValues((prev) => ({
                    ...prev,
                    previousExamId: value,
                    studentName: previous?.studentName ?? prev.studentName,
                    module: previous?.module ?? prev.module,
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a tentativa anterior" /></SelectTrigger>
                <SelectContent>
                  {previousExamOptions.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.studentName} — {exam.module} — {exam.examDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.previousExamId ? <p className="text-xs text-destructive">{errors.previousExamId}</p> : null}
            </div>
          ) : null}

          {mode === "edit" ? (
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={values.status} onValueChange={(v) => setValues((p) => ({ ...p, status: v as ExamFormValues["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(examStatusLabels) as Array<keyof typeof examStatusLabels>).map((status) => (
                    <SelectItem key={status} value={status}>{examStatusLabels[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{mode === "create" ? "Agendar prova" : "Salvar alterações"}</Button>
      </div>
    </form>
  );
}
