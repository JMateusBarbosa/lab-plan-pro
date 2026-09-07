import { useState, type FormEvent } from "react";
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
import { examStatusLabels, examTypeLabels, type ExamFormValues } from "@/types/exam";
import { buildComputerList, type Laboratory } from "@/types/laboratory";
import { getLocalDateString } from "@/lib/date";

interface ExamFormProps {
  mode: "create" | "edit";
  laboratory: Laboratory;
  initialValues?: Partial<ExamFormValues>;
  onSubmit: (values: ExamFormValues) => void;
  onCancel: () => void;
}

const emptyValues: ExamFormValues = {
  studentName: "",
  module: "",
  pcNumber: 0,
  examDate: getLocalDateString(),
  examTime: "",
  examType: "P1",
  status: "pendente",
};

export function ExamForm({
  mode,
  laboratory,
  initialValues,
  onSubmit,
  onCancel,
}: ExamFormProps) {
  const [values, setValues] = useState<ExamFormValues>({ ...emptyValues, ...initialValues });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const computers = buildComputerList(laboratory.computerCount);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.studentName.trim()) nextErrors['studentName'] = "Informe o nome do aluno.";
    if (!values.module.trim()) nextErrors['module'] = "Informe o módulo.";
    if (!values.examDate) nextErrors['examDate'] = "Informe a data da prova.";
    if (!values.pcNumber) nextErrors['pcNumber'] = "Selecione o computador.";
    if (!values.examTime) nextErrors['examTime'] = "Selecione o horário.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(mode === "create" ? { ...values, status: "pendente" } : values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da prova</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="studentName">Nome do aluno *</Label>
            <Input
              id="studentName"
              value={values.studentName}
              onChange={(e) => setValues((p) => ({ ...p, studentName: e.target.value }))}
            />
            {errors['studentName'] ? (
              <p className="text-xs text-destructive">{errors['studentName']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="module">Módulo *</Label>
            <Input
              id="module"
              value={values.module}
              onChange={(e) => setValues((p) => ({ ...p, module: e.target.value }))}
            />
            {errors['module'] ? (
              <p className="text-xs text-destructive">{errors['module']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="examDate">Data da prova *</Label>
            <Input
              id="examDate"
              type="date"
              value={values.examDate}
              onChange={(e) => setValues((p) => ({ ...p, examDate: e.target.value }))}
            />
            {errors['examDate'] ? (
              <p className="text-xs text-destructive">{errors['examDate']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Computador *</Label>
            <Select
              value={values.pcNumber ? String(values.pcNumber) : ""}
              onValueChange={(v) => setValues((p) => ({ ...p, pcNumber: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o computador" />
              </SelectTrigger>
              <SelectContent>
                {computers.map((pc) => (
                  <SelectItem key={pc} value={String(pc)}>
                    PC {pc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['pcNumber'] ? (
              <p className="text-xs text-destructive">{errors['pcNumber']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Horário *</Label>
            <Select
              value={values.examTime}
              onValueChange={(v) => setValues((p) => ({ ...p, examTime: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {laboratory.availableTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['examTime'] ? (
              <p className="text-xs text-destructive">{errors['examTime']}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo da prova *</Label>
            <Select
              value={values.examType}
              onValueChange={(v) =>
                setValues((p) => ({ ...p, examType: v as ExamFormValues["examType"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(examTypeLabels) as Array<keyof typeof examTypeLabels>).map((t) => (
                  <SelectItem key={t} value={t}>
                    {examTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "edit" ? (
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues((p) => ({ ...p, status: v as ExamFormValues["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(examStatusLabels) as Array<keyof typeof examStatusLabels>).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {examStatusLabels[s]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{mode === "create" ? "Agendar prova" : "Salvar alterações"}</Button>
      </div>
    </form>
  );
}
