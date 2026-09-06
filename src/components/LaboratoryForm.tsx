import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { LaboratoryFormValues, LaboratoryStatus } from "@/types/laboratory";

interface LaboratoryFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<LaboratoryFormValues>;
  onSubmit: (values: LaboratoryFormValues) => void;
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
  availableTimes: [],
  password: "",
  confirmPassword: "",
};

export function LaboratoryForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  onResetPassword,
}: LaboratoryFormProps) {
  const [values, setValues] = useState<LaboratoryFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [timeInput, setTimeInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof LaboratoryFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const addTime = () => {
    if (!timeInput) return;
    setValues((prev) =>
      prev.availableTimes.includes(timeInput)
        ? prev
        : { ...prev, availableTimes: [...prev.availableTimes, timeInput].sort() },
    );
    setTimeInput("");
  };

  const removeTime = (time: string) =>
    setValues((prev) => ({
      ...prev,
      availableTimes: prev.availableTimes.filter((t) => t !== time),
    }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors['name'] = "Informe o nome do laboratório.";
    if (!values.schoolName.trim()) nextErrors['schoolName'] = "Informe a unidade/escola.";
    if (!values.email.trim()) nextErrors['email'] = "Informe o e-mail de acesso.";
    if (!values.computerCount || values.computerCount < 1) {
      nextErrors['computerCount'] = "Informe pelo menos 1 computador.";
    }
    if (values.availableTimes.length === 0) {
      nextErrors['availableTimes'] = "Cadastre pelo menos um horário.";
    }
    if (mode === "create") {
      if (!values.password) nextErrors['password'] = "Informe a senha provisória.";
      if (!values.confirmPassword) nextErrors['confirmPassword'] = "Confirme a senha.";
      if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
        nextErrors['confirmPassword'] = "As senhas não conferem.";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  const field = (
    id: keyof LaboratoryFormValues,
    label: string,
    options?: { required?: boolean; type?: string; placeholder?: string },
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {options?.required ? " *" : ""}
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
        <CardHeader>
          <CardTitle className="text-base">Informações do laboratório</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("name", "Nome do laboratório", { required: true })}
          {field("schoolName", "Nome da unidade/escola", { required: true })}
          {field("responsible", "Responsável")}
          {field("phone", "Telefone", { placeholder: "(92) 99999-0000" })}
          {field("city", "Cidade")}
          {field("state", "Estado", { placeholder: "AM" })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações do laboratório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="computerCount">Quantidade de computadores *</Label>
            <Input
              id="computerCount"
              type="number"
              min={1}
              value={String(values.computerCount ?? "")}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, computerCount: Number(e.target.value) }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Os computadores (PC 1 a PC {values.computerCount || 1}) são gerados automaticamente.
            </p>
            {errors['computerCount'] ? (
              <p className="text-xs text-destructive">{errors['computerCount']}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeInput">Horários de aula/prova *</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="timeInput"
                type="time"
                className="w-40"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTime();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTime}>
                Adicionar horário
              </Button>
            </div>
            {errors['availableTimes'] ? (
              <p className="text-xs text-destructive">{errors['availableTimes']}</p>
            ) : null}

            <div className="pt-2">
              <p className="mb-2 text-xs text-muted-foreground">Horários cadastrados</p>
              {values.availableTimes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum horário cadastrado.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {values.availableTimes.map((time) => (
                    <li key={time}>
                      <Badge variant="secondary" className="gap-1 py-1 pl-2 pr-1">
                        {time}
                        <button
                          type="button"
                          aria-label={`Remover ${time}`}
                          className="rounded p-0.5 hover:bg-background"
                          onClick={() => removeTime(time)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados de acesso</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("email", "E-mail/login", { required: true, type: "email" })}
          {mode === "create" ? (
            <>
              {field("password", "Senha provisória", { required: true, type: "password" })}
              {field("confirmPassword", "Confirmar senha", { required: true, type: "password" })}
            </>
          ) : (
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={onResetPassword}>
                Redefinir senha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {mode === "create" ? "Cadastrar laboratório" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
