import type { AuditLogRecord } from "@/lib/admin-audit-api";

export const auditActionLabels: Record<string, string> = {
  insert: "Criação",
  update: "Atualização",
  soft_delete: "Exclusão",
  restore: "Restauração",
  admin_update: "Atualização administrativa",
  status_change: "Alteração de status",
  provision: "Provisionamento",
};

export const auditEntityLabels: Record<string, string> = {
  exam: "Prova",
  laboratory: "Laboratório",
  laboratory_account: "Conta do laboratório",
};

export const auditFieldLabels: Record<string, string> = {
  id: "ID",
  email: "E-mail",
  password_changed: "Senha alterada",
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

export function formatAuditDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Manaus",
  }).format(new Date(value));
}

export function toAuditObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function formatAuditValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function getAuditChangedFields(record: AuditLogRecord) {
  const before = toAuditObject(record.beforeData) ?? {};
  const after = toAuditObject(record.afterData) ?? {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({
      key,
      label: auditFieldLabels[key] ?? key,
      before: before[key],
      after: after[key],
    }));
}
