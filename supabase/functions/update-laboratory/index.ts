import { createClient } from "npm:@supabase/supabase-js@2.57.4";

type ScheduleInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active?: boolean;
};

type UpdatePayload = {
  laboratoryId: string;
  laboratory: {
    name: string;
    schoolName: string;
    responsible?: string;
    phone?: string;
    city: string;
    state: string;
    status: "ativo" | "inativo";
    computerCount: number;
  };
  schedules: ScheduleInput[];
};

const BUSINESS_TIME_ZONE = "America/Manaus";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function dayOfWeekFromDate(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Configuração interna do Supabase ausente." }, 500);
  }
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Sessão inválida." }, 401);
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await service.auth.getUser(token);
  if (userError || !userData.user) return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (profileError || profile?.role !== "admin") {
    return jsonResponse({ error: "Apenas administradores podem atualizar laboratórios." }, 403);
  }

  let payload: UpdatePayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
  }

  if (!payload?.laboratoryId || !payload.laboratory?.name?.trim() || !payload.laboratory.schoolName?.trim()) {
    return jsonResponse({ error: "Dados do laboratório incompletos." }, 400);
  }
  if (!payload.laboratory.city?.trim() || !payload.laboratory.state?.trim()) {
    return jsonResponse({ error: "Cidade e estado são obrigatórios." }, 400);
  }
  if (!["ativo", "inativo"].includes(payload.laboratory.status)) {
    return jsonResponse({ error: "Status do laboratório inválido." }, 400);
  }
  if (!Number.isInteger(payload.laboratory.computerCount) || payload.laboratory.computerCount < 1) {
    return jsonResponse({ error: "Quantidade de computadores inválida." }, 400);
  }
  if (!Array.isArray(payload.schedules) || payload.schedules.length === 0) {
    return jsonResponse({ error: "Cadastre pelo menos um horário." }, 400);
  }

  const uniqueStarts = new Set<string>();
  for (const schedule of payload.schedules) {
    if (!Number.isInteger(schedule.dayOfWeek) || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      return jsonResponse({ error: "Há um dia da semana inválido." }, 400);
    }
    if (!isValidTime(schedule.startTime) || !isValidTime(schedule.endTime) || schedule.endTime <= schedule.startTime) {
      return jsonResponse({ error: "Há um horário inválido." }, 400);
    }
    const key = `${schedule.dayOfWeek}:${schedule.startTime}`;
    if (uniqueStarts.has(key)) return jsonResponse({ error: "Há horários duplicados." }, 400);
    uniqueStarts.add(key);
  }

  const { data: oldLaboratory, error: oldLaboratoryError } = await service
    .from("laboratories")
    .select("*")
    .eq("id", payload.laboratoryId)
    .single();
  if (oldLaboratoryError || !oldLaboratory) {
    return jsonResponse({ error: "Laboratório não encontrado." }, 404);
  }

  const { data: oldSchedules, error: oldSchedulesError } = await service
    .from("laboratory_schedules")
    .select("day_of_week, start_time, end_time, active")
    .eq("laboratory_id", payload.laboratoryId);
  if (oldSchedulesError) {
    return jsonResponse({ error: "Não foi possível carregar os horários atuais." }, 500);
  }

  const today = getTodayInBusinessTimeZone();
  const { data: futureExams, error: futureExamsError } = await service
    .from("exams")
    .select("exam_date, pc_number, student_class_time")
    .eq("laboratory_id", payload.laboratoryId)
    .gte("exam_date", today);

  if (futureExamsError) {
    return jsonResponse({ error: "Não foi possível validar as provas futuras do laboratório." }, 500);
  }

  for (const exam of futureExams ?? []) {
    if (exam.pc_number > payload.laboratory.computerCount) {
      return jsonResponse({
        error:
          "A quantidade de computadores não pode ser reduzida porque existem provas de hoje ou futuras agendadas em PCs acima do novo limite.",
      }, 409);
    }

    const examDay = dayOfWeekFromDate(exam.exam_date);
    const examTime = exam.student_class_time.slice(0, 5);
    const remainsValid = payload.schedules.some(
      (schedule) =>
        (schedule.active ?? true) &&
        schedule.dayOfWeek === examDay &&
        schedule.startTime === examTime,
    );

    if (!remainsValid) {
      return jsonResponse({
        error:
          "Os horários não podem ser alterados dessa forma porque existem provas de hoje ou futuras usando um horário que seria removido ou desativado.",
      }, 409);
    }
  }

  const restore = async () => {
    await service.from("laboratories").update({
      name: oldLaboratory.name,
      school_name: oldLaboratory.school_name,
      responsible: oldLaboratory.responsible,
      phone: oldLaboratory.phone,
      city: oldLaboratory.city,
      state: oldLaboratory.state,
      status: oldLaboratory.status,
      computer_count: oldLaboratory.computer_count,
    }).eq("id", payload.laboratoryId);

    await service.from("laboratory_schedules").delete().eq("laboratory_id", payload.laboratoryId);
    if (oldSchedules?.length) {
      await service.from("laboratory_schedules").insert(
        oldSchedules.map((schedule) => ({ ...schedule, laboratory_id: payload.laboratoryId })),
      );
    }
  };

  try {
    const { error: updateError } = await service.from("laboratories").update({
      name: payload.laboratory.name.trim(),
      school_name: payload.laboratory.schoolName.trim(),
      responsible: payload.laboratory.responsible?.trim() || null,
      phone: payload.laboratory.phone?.trim() || null,
      city: payload.laboratory.city.trim(),
      state: payload.laboratory.state.trim(),
      status: payload.laboratory.status,
      computer_count: payload.laboratory.computerCount,
    }).eq("id", payload.laboratoryId);
    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await service
      .from("laboratory_schedules")
      .delete()
      .eq("laboratory_id", payload.laboratoryId);
    if (deleteError) throw new Error(deleteError.message);

    const { error: insertError } = await service.from("laboratory_schedules").insert(
      payload.schedules.map((schedule) => ({
        laboratory_id: payload.laboratoryId,
        day_of_week: schedule.dayOfWeek,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        active: schedule.active ?? true,
      })),
    );
    if (insertError) throw new Error(insertError.message);

    return jsonResponse({ laboratoryId: payload.laboratoryId });
  } catch (error) {
    await restore();
    const message = error instanceof Error ? error.message : "Falha ao atualizar laboratório.";
    return jsonResponse({ error: message }, 400);
  }
});
