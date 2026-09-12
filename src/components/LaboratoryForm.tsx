import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LaboratoryFormValues, LaboratoryStatus } from "@/types/laboratory";
import {
  dayOfWeekLabels,
  type LaboratoryScheduleInput,
} from "@/types/laboratory-schedule";

interface LaboratoryFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<LaboratoryFormValues>;
  initialSchedules?: LaboratoryScheduleInput[];
  onSubmit: (values: LaboratoryFormValues, schedules: LaboratoryScheduleInput[]) => void;
  onCancel: () => void;
  onResetPassword?: () => void;
}

const emptyValues: LaboratoryFormValues = {
  name: "",
  schoolName: "",
  responsible: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  status: "ativo",
  computerCount: 1,
  password: "",
  confirmPassword: "",
};

export function LaboratoryForm({
  mode,
  initialValues,
  initialSchedules = [],
  onSubmit,
  onCancel,
  onResetPassword,
}: LaboratoryFormProps) {
  const [values, setValues] = useState<LaboratoryFormValues>({ ...emptyValues, ...initialValues });
  const [schedules, setSchedules] = useState<LaboratoryScheduleInput[]>(initialSchedules);
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof LaboratoryFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const addSchedule = () => {
    const day = Number(dayOfWeek);
    if (!startTime || !endTime) return;
    if (endTime <= startTime) {
      setErrors((prev) => ({ ...prev, schedules: "O horário final deve ser posterior ao inicial." }));
      return;
    }
    const duplicate = schedules.some(
      (schedule) => schedule.dayOfWeek === day && schedule.startTime === startTime,
    );
    if (duplicate) {
      setErrors((prev) => ({ ...prev, schedules: "Já existe um horário com este início nesse dia." }));
      return;
    }

    setSchedules((prev) =>
      [...prev, { dayOfWeek: day, startTime, endTime, active: true }].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
      ),
    );
    setStartTime("");
    setEndTime("");
    setErrors((prev) => ({ ...prev, schedules: "" }));
  };

  const removeSchedule = (index: number) =>
    setSchedules((prev) => prev.filter((_, currentIndex) => currentIndex !== index));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = "Informe o nome do laboratório.";
    if (!values.schoolName.trim()) nextErrors.schoolName = "Informe a unidade/escola.";
    if (!values.email.trim()) nextErrors.email = "Informe o e-mail de acesso.";
    if (!values.city.trim()) nextErrors.city = "Informe a cidade.";
    if (!values.state.trim()) nextErrors.state = "Informe o estado.";
    if (!values.computerCount || values.computerCount < 1) {
      nextErrors.computerCount = "Informe pelo menos 1 computador.";
    }
    if (schedules.length === 0) nextErrors.schedules = "Cadastre pelo menos um horário.";
    if (mode === "create") {
      if (!values.password) nextErrors.password = "Informe a senha provisória.";
      if (!values.confirmPassword) nextErrors.confirmPassword = "Confirme a senha.";
      if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
        nextErrors.confirmPassword = "As senhas não conferem.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values, schedules);
  };

  const field = (
    id: keyof LaboratoryFormValues,
    label: string,
    options?: { required?: boolean; type?: string; placeholder?: string },
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{options?.required ? " *" : ""}
      </Label>
      <Input
        id={id}
        type={options?.type ?? "text"}
        placeholder={options?.placeholder}
        value={(values[id] as string) ?? ""}
        onChange={(e) => set(id, e.target.value)}
      />
      {errors[id] ? <p className="text-xs text-destructive">{errors[id]}</p> : null}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Informações do laboratório</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("name", "Nome do laboratório", { required: true })}
          {field("schoolName", "Nome da unidade/escola", { required: true })}
          {field("responsible", "Responsável")}
          {field("phone", "Telefone", { placeholder: "(92) 99999-0000" })}
          {field("city", "Cidade", { required: true })}
          {field("state", "Estado", { required: true, placeholder: "AM" })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Configurações do laboratório</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="computerCount">Quantidade de computadores *</Label>
            <Input
              id="computerCount"
              type="number"
              min={1}
              value={String(values.computerCount ?? "")}
              onChange={(e) => setValues((prev) => ({ ...prev, computerCount: Number(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">
              O sistema disponibilizará PC 1 até PC {values.computerCount || 1}.
            </p>
            {errors.computerCount ? <p className="text-xs text-destructive">{errors.computerCount}</p> : null}
          </div>

          <div className="space-y-3">
            <div>
              <Label>Horários de aula/prova *</Label>
              <p className="text-xs text-muted-foreground">
                Cadastre os intervalos por dia da semana. A data escolhida na prova determinará quais horários estarão disponíveis.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(dayOfWeekLabels).map(([day, label]) => (
                    <SelectItem key={day} value={day}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <Button type="button" variant="outline" onClick={addSchedule}>Adicionar horário</Button>
            </div>
            {errors.schedules ? <p className="text-xs text-destructive">{errors.schedules}</p> : null}

            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum horário cadastrado.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {schedules.map((schedule, index) => (
                  <li key={`${schedule.dayOfWeek}-${schedule.startTime}-${index}`}>
                    <Badge variant="secondary" className="gap-1 py-1 pl-2 pr-1">
                      {dayOfWeekLabels[schedule.dayOfWeek]}: {schedule.startTime}–{schedule.endTime}
                      <button
                        type="button"
                        aria-label="Remover horário"
                        className="rounded p-0.5 hover:bg-background"
                        onClick={() => removeSchedule(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados de acesso</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("email", "E-mail/login", { required: true, type: "email" })}
          {mode === "create" ? (
            <>
              {field("password", "Senha provisória", { required: true, type: "password" })}
              {field("confirmPassword", "Confirmar senha", { required: true, type: "password" })}
            </>
          ) : (
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={onResetPassword}>Redefinir senha</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup
            value={values.status}
            onValueChange={(value) => set("status", value as LaboratoryStatus)}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="ativo" id="status-ativo" />
              <Label htmlFor="status-ativo">Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="inativo" id="status-inativo" />
              <Label htmlFor="status-inativo">Inativo</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{mode === "create" ? "Cadastrar laboratório" : "Salvar alterações"}</Button>
      </div>
    </form>
  );
}
