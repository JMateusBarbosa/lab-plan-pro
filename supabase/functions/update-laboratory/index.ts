import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  corsHeadersForRequest,
  handleCorsPreflight,
  isOriginAllowed,
} from "../_shared/cors.ts";

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

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersForRequest(req);
  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return handleCorsPreflight(req);
  if (!isOriginAllowed(req.headers.get("Origin"))) {
    return jsonResponse({ error: "Origem não autorizada." }, 403);
  }
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
  const caller = userData.user;
  if (userError || !caller) return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
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

  const { error } = await service.rpc("admin_update_laboratory_config", {
    p_actor_user_id: caller.id,
    p_laboratory_id: payload.laboratoryId,
    p_laboratory: payload.laboratory,
    p_schedules: payload.schedules,
  });

  if (error) {
    const message = error.message || "Falha ao atualizar laboratório.";
    const status = message.includes("não pode") || message.includes("não podem") ? 409 : 400;
    return jsonResponse({ error: message }, status);
  }

  return jsonResponse({ laboratoryId: payload.laboratoryId });
});
