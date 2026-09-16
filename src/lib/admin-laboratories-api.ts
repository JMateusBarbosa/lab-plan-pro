import { supabase } from "@/lib/supabase";
import type { Laboratory, LaboratoryAccessFormValues, LaboratoryFormValues } from "@/types/laboratory";
import type { LaboratorySchedule, LaboratoryScheduleInput } from "@/types/laboratory-schedule";

const BUSINESS_TIME_ZONE = "America/Manaus";

export interface AdminLaboratoryRecord {
  laboratory: Laboratory;
  accessEmail: string;
}

export interface AdminExamSummary {
  total: number;
  pending: number;
  approved: number;
  today: number;
}

export interface AdminLaboratoryDetails extends AdminLaboratoryRecord {
  schedules: LaboratorySchedule[];
  examSummary: AdminExamSummary;
}

export interface AdminDashboardData {
  laboratories: AdminLaboratoryRecord[];
  totalExams: number;
}

function mapLaboratory(row: {
  id: string;
  name: string;
  school_name: string;
  responsible: string | null;
  phone: string | null;
  city: string;
  state: string;
  status: string;
  computer_count: number;
  created_at: string;
  updated_at: string;
}): Laboratory {
  return {
    id: row.id,
    name: row.name,
    schoolName: row.school_name,
    responsible: row.responsible ?? "",
    phone: row.phone ?? "",
    city: row.city,
    state: row.state,
    status: row.status as Laboratory["status"],
    computerCount: row.computer_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSchedule(row: {
  id: string;
  laboratory_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}): LaboratorySchedule {
  return {
    id: row.id,
    laboratoryId: row.laboratory_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getTodayInBusinessTimeZone() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getMessageFromFunctionPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();

  if (record.error && typeof record.error === "object") {
    const nestedError = record.error as Record<string, unknown>;
    if (typeof nestedError.message === "string" && nestedError.message.trim()) {
      return nestedError.message.trim();
    }
  }

  return null;
}

async function throwFunctionError(error: unknown, fallback: string): Promise<never> {
  let responseStatus: number | null = null;

  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;

    if (context && typeof context === "object" && "clone" in context) {
      const response = context as Response;
      responseStatus = typeof response.status === "number" ? response.status : null;

      try {
        const payload = (await response.clone().json()) as unknown;
        const message = getMessageFromFunctionPayload(payload);
        if (message) throw new Error(message);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== "Unexpected end of JSON input") {
          throw parseError;
        }
      }

      try {
        const text = (await response.clone().text()).trim();
        if (text) throw new Error(text);
      } catch (readError) {
        if (readError instanceof Error && readError.message && readError.message !== "Body is unusable") {
          throw readError;
        }
      }
    }
  }

  if (
    error instanceof Error &&
    error.message &&
    error.message !== "Edge Function returned a non-2xx status code"
  ) {
    throw error;
  }

  throw new Error(responseStatus ? `${fallback} (HTTP ${responseStatus}).` : fallback);
}

export async function listAdminLaboratories(): Promise<AdminLaboratoryRecord[]> {
  const [{ data: labs, error: labsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from("laboratories").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("laboratory_id, email").eq("role", "laboratory"),
  ]);

  if (labsError) throw labsError;
  if (profilesError) throw profilesError;

  const emails = new Map(
    (profiles ?? [])
      .filter((profile) => profile.laboratory_id)
      .map((profile) => [profile.laboratory_id as string, profile.email]),
  );

  return (labs ?? []).map((lab) => ({
    laboratory: mapLaboratory(lab),
    accessEmail: emails.get(lab.id) ?? "",
  }));
}

export async function getAdminLaboratory(id: string): Promise<AdminLaboratoryDetails | null> {
  const [
    { data: lab, error: labError },
    { data: profile, error: profileError },
    { data: schedules, error: schedulesError },
    { data: exams, error: examsError },
  ] = await Promise.all([
    supabase.from("laboratories").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("profiles")
      .select("email")
      .eq("role", "laboratory")
      .eq("laboratory_id", id)
      .maybeSingle(),
    supabase
      .from("laboratory_schedules")
      .select("*")
      .eq("laboratory_id", id)
      .order("day_of_week")
      .order("start_time"),
    supabase.from("exams").select("status, exam_date").eq("laboratory_id", id),
  ]);

  if (labError) throw labError;
  if (profileError) throw profileError;
  if (schedulesError) throw schedulesError;
  if (examsError) throw examsError;
  if (!lab) return null;

  const today = getTodayInBusinessTimeZone();
  const examRows = exams ?? [];

  return {
    laboratory: mapLaboratory(lab),
    accessEmail: profile?.email ?? "",
    schedules: (schedules ?? []).map(mapSchedule),
    examSummary: {
      total: examRows.length,
      pending: examRows.filter((exam) => exam.status === "pendente").length,
      approved: examRows.filter((exam) => exam.status === "aprovado").length,
      today: examRows.filter((exam) => exam.exam_date === today).length,
    },
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [laboratories, examsResult] = await Promise.all([
    listAdminLaboratories(),
    supabase.from("exams").select("id", { count: "exact", head: true }),
  ]);

  if (examsResult.error) throw examsResult.error;

  return {
    laboratories,
    totalExams: examsResult.count ?? 0,
  };
}

export async function provisionLaboratory(
  values: LaboratoryFormValues,
  access: LaboratoryAccessFormValues,
  schedules: LaboratoryScheduleInput[],
) {
  if (!access.password) throw new Error("Informe a senha provisória.");

  const { data, error } = await supabase.functions.invoke("provision-laboratory", {
    body: {
      laboratory: {
        name: values.name,
        schoolName: values.schoolName,
        responsible: values.responsible,
        phone: values.phone,
        city: values.city,
        state: values.state,
        status: values.status,
        computerCount: values.computerCount,
      },
      access: {
        email: access.email,
        password: access.password,
      },
      schedules,
    },
  });

  if (error) {
    await throwFunctionError(error, "Não foi possível cadastrar o laboratório.");
  }
  if (data?.error) throw new Error(data.error);
  return data as { laboratoryId: string; userId: string; email: string };
}

export async function updateLaboratory(
  id: string,
  values: LaboratoryFormValues,
  schedules: LaboratoryScheduleInput[],
) {
  const { data, error } = await supabase.functions.invoke("update-laboratory", {
    body: {
      laboratoryId: id,
      laboratory: {
        name: values.name,
        schoolName: values.schoolName,
        responsible: values.responsible,
        phone: values.phone,
        city: values.city,
        state: values.state,
        status: values.status,
        computerCount: values.computerCount,
      },
      schedules,
    },
  });

  if (error) {
    await throwFunctionError(error, "Não foi possível atualizar o laboratório.");
  }
  if (data?.error) throw new Error(data.error);
  return data as { laboratoryId: string };
}

export async function toggleLaboratoryStatus(id: string, currentStatus: Laboratory["status"]) {
  const nextStatus = currentStatus === "ativo" ? "inativo" : "ativo";
  const { data, error } = await supabase.functions.invoke("set-laboratory-status", {
    body: { laboratoryId: id, status: nextStatus },
  });

  if (error) {
    await throwFunctionError(error, "Não foi possível alterar o status do laboratório.");
  }
  if (data?.error) throw new Error(data.error);
  return nextStatus;
}
