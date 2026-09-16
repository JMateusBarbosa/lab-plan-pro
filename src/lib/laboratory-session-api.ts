import { supabase } from "@/lib/supabase";
import type { Laboratory } from "@/types/laboratory";
import type { LaboratorySchedule } from "@/types/laboratory-schedule";

export interface LaboratorySessionData {
  userId: string;
  email: string;
  laboratory: Laboratory;
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

export async function getLaboratorySession(): Promise<LaboratorySessionData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, laboratory_id, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profile || profile.role !== "laboratory" || !profile.laboratory_id) {
    throw new Error("Esta conta não possui acesso à área do laboratório.");
  }

  const [{ data: laboratory, error: laboratoryError }, { data: schedules, error: schedulesError }] =
    await Promise.all([
      supabase.from("laboratories").select("*").eq("id", profile.laboratory_id).maybeSingle(),
      supabase
        .from("laboratory_schedules")
        .select("*")
        .eq("laboratory_id", profile.laboratory_id)
        .order("day_of_week")
        .order("start_time"),
    ]);

  if (laboratoryError) throw laboratoryError;
  if (schedulesError) throw schedulesError;

  // A policy RLS só libera o laboratório quando ele está ativo.
  if (!laboratory) {
    throw new Error("Este laboratório está inativo ou não está disponível para acesso.");
  }

  return {
    userId: user.id,
    email: profile.email,
    laboratory: mapLaboratory(laboratory),
    schedules: (schedules ?? []).map(mapSchedule),
  };
}

export async function signInLaboratory(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    const message = error?.message?.toLowerCase() ?? "";
    if (message.includes("email not confirmed")) {
      throw new Error("Seu e-mail ainda não foi confirmado.");
    }
    throw new Error("E-mail ou senha inválidos.");
  }

  try {
    return await getLaboratorySession();
  } catch (sessionError) {
    await supabase.auth.signOut();
    throw sessionError;
  }
}

export async function signOutLaboratory() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
