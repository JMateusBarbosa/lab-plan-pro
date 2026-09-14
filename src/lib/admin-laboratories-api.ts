import { supabase } from "@/lib/supabase";
import type { Laboratory, LaboratoryAccessFormValues, LaboratoryFormValues } from "@/types/laboratory";
import type { LaboratorySchedule, LaboratoryScheduleInput } from "@/types/laboratory-schedule";

export interface AdminLaboratoryRecord {
  laboratory: Laboratory;
  accessEmail: string;
}

export interface AdminLaboratoryDetails extends AdminLaboratoryRecord {
  schedules: LaboratorySchedule[];
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
  const [{ data: lab, error: labError }, { data: profile, error: profileError }, { data: schedules, error: schedulesError }] =
    await Promise.all([
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
    ]);

  if (labError) throw labError;
  if (profileError) throw profileError;
  if (schedulesError) throw schedulesError;
  if (!lab) return null;

  return {
    laboratory: mapLaboratory(lab),
    accessEmail: profile?.email ?? "",
    schedules: (schedules ?? []).map(mapSchedule),
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

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { laboratoryId: string; userId: string; email: string };
}

export async function toggleLaboratoryStatus(id: string, currentStatus: Laboratory["status"]) {
  const nextStatus = currentStatus === "ativo" ? "inativo" : "ativo";
  const { error } = await supabase.from("laboratories").update({ status: nextStatus }).eq("id", id);
  if (error) throw error;
  return nextStatus;
}
