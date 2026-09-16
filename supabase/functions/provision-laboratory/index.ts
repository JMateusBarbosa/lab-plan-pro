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

const MIN_PASSWORD_LENGTH = 12;
const PASSWORD_POLICY_MESSAGE =
  "A senha provisória deve ter pelo menos 12 caracteres e incluir letra maiúscula, letra minúscula, número e símbolo.";

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function hasStrongPassword(password: string) {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already been registered") ||
    normalized.includes("already registered") ||
    normalized.includes("user already exists")
  ) {
    return "Já existe um usuário cadastrado com este e-mail.";
  }

  if (normalized.includes("password")) return PASSWORD_POLICY_MESSAGE;

  if (
    normalized.includes("database error creating new user") ||
    normalized.includes("database error saving new user")
  ) {
    return "Não foi possível criar a conta de acesso no momento. Tente novamente ou contate o administrador do sistema.";
  }

  if (normalized.includes("invalid email")) {
    return "Informe um e-mail válido para a conta de acesso.";
  }

  return message;
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
  if (!access?.password || !hasStrongPassword(access.password)) return PASSWORD_POLICY_MESSAGE;
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
  const idempotencyKey = req.headers.get("x-idempotency-key")?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Configuração interna do Supabase ausente." }, 500);
  }
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Sessão inválida." }, 401);
  }
  if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
    return jsonResponse({ error: "Chave de idempotência inválida." }, 400);
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
  if (validationError) return jsonResponse({ error: validationError }, 400);

  const email = payload.access.email.trim().toLowerCase();
  const requestHash = await sha256Hex(
    JSON.stringify({ laboratory: payload.laboratory, schedules: payload.schedules, email }),
  );

  const operation = "provision_laboratory";
  const { error: claimError } = await service.from("admin_operation_requests").insert({
    actor_user_id: caller.id,
    operation,
    idempotency_key: idempotencyKey,
    request_hash: requestHash,
    status: "processing",
  });

  if (claimError) {
    if (claimError.code !== "23505") {
      return jsonResponse({ error: "Não foi possível iniciar o provisionamento com segurança." }, 500);
    }

    const { data: existing, error: existingError } = await service
      .from("admin_operation_requests")
      .select("request_hash, status, result")
      .eq("actor_user_id", caller.id)
      .eq("operation", operation)
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existingError || !existing) {
      return jsonResponse({ error: "Não foi possível validar a tentativa anterior." }, 500);
    }
    if (existing.request_hash !== requestHash) {
      return jsonResponse({ error: "Esta chave de idempotência já foi usada com outros dados." }, 409);
    }
    if (existing.status === "completed" && existing.result) {
      return jsonResponse(existing.result, 200);
    }
    if (existing.status === "processing") {
      return jsonResponse({ error: "Este cadastro já está sendo processado." }, 409);
    }

    const { error: retryError } = await service
      .from("admin_operation_requests")
      .update({ status: "processing", error_message: null, result: null })
      .eq("actor_user_id", caller.id)
      .eq("operation", operation)
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "failed");

    if (retryError) {
      return jsonResponse({ error: "Não foi possível reiniciar a tentativa anterior." }, 500);
    }
  }

  let laboratoryId: string | null = null;
  let authUserId: string | null = null;

  const cleanup = async () => {
    if (authUserId) await service.auth.admin.deleteUser(authUserId);
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

    const { error: schedulesError } = await service.from("laboratory_schedules").insert(
      payload.schedules.map((schedule) => ({
        laboratory_id: laboratoryId,
        day_of_week: schedule.dayOfWeek,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        active: schedule.active ?? true,
      })),
    );
    if (schedulesError) throw new Error(schedulesError.message);

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
      throw new Error(
        authError?.message ? translateAuthError(authError.message) : "Não foi possível criar a conta de acesso.",
      );
    }

    authUserId = authData.user.id;

    const { error: profileInsertError } = await service.from("profiles").insert({
      id: authUserId,
      role: "laboratory",
      laboratory_id: laboratoryId,
      email,
    });

    if (profileInsertError) {
      throw new Error(
        profileInsertError.code === "23505"
          ? "Já existe uma conta de acesso vinculada a este laboratório ou e-mail."
          : "A conta foi criada, mas não foi possível concluir o perfil do laboratório.",
      );
    }

    const result = { laboratoryId, userId: authUserId, email };

    const { error: auditError } = await service.from("audit_logs").insert({
      actor_user_id: caller.id,
      actor_role: "admin",
      laboratory_id: laboratoryId,
      action: "provision",
      entity_type: "laboratory",
      entity_id: laboratoryId,
      after_data: result,
      metadata: { schoolName: payload.laboratory.schoolName },
    });
    if (auditError) throw new Error("O cadastro foi criado, mas não foi possível registrar a auditoria.");

    const { error: completeError } = await service
      .from("admin_operation_requests")
      .update({ status: "completed", result, error_message: null })
      .eq("actor_user_id", caller.id)
      .eq("operation", operation)
      .eq("idempotency_key", idempotencyKey);
    if (completeError) throw new Error("O cadastro foi criado, mas não foi possível concluir o controle da operação.");

    return jsonResponse(result, 201);
  } catch (error) {
    await cleanup();
    const message = error instanceof Error ? error.message : "Falha ao cadastrar laboratório.";

    await service
      .from("admin_operation_requests")
      .update({ status: "failed", error_message: message, result: null })
      .eq("actor_user_id", caller.id)
      .eq("operation", operation)
      .eq("idempotency_key", idempotencyKey);

    return jsonResponse({ error: message }, 400);
  }
});
