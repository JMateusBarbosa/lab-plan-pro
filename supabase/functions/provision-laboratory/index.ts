import { createClient } from "npm:@supabase/supabase-js@2.57.4";

type ScheduleInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active?: boolean;
};

type ProvisionPayload = {
  laboratory: {
    name: string;
    schoolName: string;
    responsible?: string;
    phone?: string;
    city: string;
    state: string;
    status?: "ativo" | "inativo";
    computerCount: number;
  };
  schedules: ScheduleInput[];
  access: {
    email: string;
    password: string;
  };
};

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

function validatePayload(payload: ProvisionPayload) {
  const { laboratory, schedules, access } = payload;

  if (!laboratory?.name?.trim()) return "Informe o nome do laboratório.";
  if (!laboratory?.schoolName?.trim()) return "Informe a unidade/escola.";
  if (!laboratory?.city?.trim()) return "Informe a cidade.";
  if (!laboratory?.state?.trim()) return "Informe o estado.";
  if (!Number.isInteger(laboratory?.computerCount) || laboratory.computerCount < 1) {
    return "A quantidade de computadores deve ser um inteiro maior que zero.";
  }
  if (!access?.email?.trim()) return "Informe o e-mail de acesso.";
  if (!access?.password || access.password.length < 6) {
    return "A senha provisória deve ter pelo menos 6 caracteres.";
  }
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return "Cadastre pelo menos um horário para o laboratório.";
  }

  const uniqueStarts = new Set<string>();
  for (const schedule of schedules) {
    if (!Number.isInteger(schedule.dayOfWeek) || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      return "Há um dia da semana inválido nos horários.";
    }
    if (!isValidTime(schedule.startTime) || !isValidTime(schedule.endTime)) {
      return "Há um horário em formato inválido.";
    }
    if (schedule.endTime <= schedule.startTime) {
      return "O horário final deve ser posterior ao inicial.";
    }
    const key = `${schedule.dayOfWeek}:${schedule.startTime}`;
    if (uniqueStarts.has(key)) return "Há horários duplicados para o mesmo dia e início.";
    uniqueStarts.add(key);
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

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
  const caller = userData.user;

  if (userError || !caller) {
    return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return jsonResponse({ error: "Apenas administradores podem cadastrar laboratórios." }, 403);
  }

  let payload: ProvisionPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }

  const email = payload.access.email.trim().toLowerCase();
  let laboratoryId: string | null = null;
  let authUserId: string | null = null;

  const cleanup = async () => {
    if (authUserId) {
      await service.auth.admin.deleteUser(authUserId);
    }
    if (laboratoryId) {
      await service.from("laboratory_schedules").delete().eq("laboratory_id", laboratoryId);
      await service.from("laboratories").delete().eq("id", laboratoryId);
    }
  };

  try {
    const { data: laboratory, error: laboratoryError } = await service
      .from("laboratories")
      .insert({
        name: payload.laboratory.name.trim(),
        school_name: payload.laboratory.schoolName.trim(),
        responsible: payload.laboratory.responsible?.trim() || null,
        phone: payload.laboratory.phone?.trim() || null,
        city: payload.laboratory.city.trim(),
        state: payload.laboratory.state.trim(),
        status: payload.laboratory.status ?? "ativo",
        computer_count: payload.laboratory.computerCount,
      })
      .select("id")
      .single();

    if (laboratoryError || !laboratory) {
      throw new Error(laboratoryError?.message || "Não foi possível criar o laboratório.");
    }

    laboratoryId = laboratory.id;

    const scheduleRows = payload.schedules.map((schedule) => ({
      laboratory_id: laboratoryId,
      day_of_week: schedule.dayOfWeek,
      start_time: schedule.startTime,
      end_time: schedule.endTime,
      active: schedule.active ?? true,
    }));

    const { error: schedulesError } = await service.from("laboratory_schedules").insert(scheduleRows);
    if (schedulesError) {
      throw new Error(schedulesError.message);
    }

    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password: payload.access.password,
      email_confirm: true,
      app_metadata: {
        provisioned_by_admin: "true",
        profile_role: "laboratory",
        laboratory_id: laboratoryId,
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Não foi possível criar a conta de acesso.");
    }

    authUserId = authData.user.id;

    const { data: createdProfile, error: createdProfileError } = await service
      .from("profiles")
      .select("id, role, laboratory_id, email")
      .eq("id", authUserId)
      .single();

    if (
      createdProfileError ||
      createdProfile?.role !== "laboratory" ||
      createdProfile?.laboratory_id !== laboratoryId
    ) {
      throw new Error("A conta foi criada, mas o perfil do laboratório não foi provisionado corretamente.");
    }

    return jsonResponse({
      laboratoryId,
      userId: authUserId,
      email: createdProfile.email,
    }, 201);
  } catch (error) {
    await cleanup();
    const message = error instanceof Error ? error.message : "Falha ao cadastrar laboratório.";
    return jsonResponse({ error: message }, 400);
  }
});
