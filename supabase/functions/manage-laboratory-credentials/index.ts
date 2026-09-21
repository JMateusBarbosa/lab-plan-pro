import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  corsHeadersForRequest,
  handleCorsPreflight,
  isOriginAllowed,
} from "../_shared/cors.ts";

type CredentialPayload =
  | {
      operation: "update_email";
      laboratoryId: string;
      email: string;
    }
  | {
      operation: "reset_password";
      laboratoryId: string;
      password: string;
    };

const PASSWORD_POLICY_MESSAGE =
  "A nova senha deve ter pelo menos 12 caracteres e incluir letra maiúscula, letra minúscula, número e símbolo.";

function hasStrongPassword(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function isValidEmail(email: string) {
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already been registered") ||
    normalized.includes("already registered") ||
    normalized.includes("user already exists") ||
    normalized.includes("email address already")
  ) {
    return "Já existe uma conta cadastrada com este e-mail.";
  }

  if (normalized.includes("invalid email")) {
    return "Informe um e-mail válido.";
  }

  if (normalized.includes("password")) {
    return PASSWORD_POLICY_MESSAGE;
  }

  return message;
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

  const { data: callerProfile, error: callerProfileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfileError || callerProfile?.role !== "admin") {
    return jsonResponse(
      { error: "Apenas administradores podem gerenciar credenciais de laboratórios." },
      403,
    );
  }

  let payload: CredentialPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
  }

  if (
    !payload?.laboratoryId ||
    !["update_email", "reset_password"].includes(payload.operation)
  ) {
    return jsonResponse({ error: "Operação de credenciais inválida." }, 400);
  }

  const { data: accountProfile, error: accountProfileError } = await service
    .from("profiles")
    .select("id, email, role, laboratory_id")
    .eq("role", "laboratory")
    .eq("laboratory_id", payload.laboratoryId)
    .maybeSingle();

  if (accountProfileError) {
    return jsonResponse({ error: "Não foi possível carregar a conta do laboratório." }, 500);
  }
  if (!accountProfile) {
    return jsonResponse({ error: "Conta de acesso do laboratório não encontrada." }, 404);
  }

  const { data: authUserData, error: authUserError } =
    await service.auth.admin.getUserById(accountProfile.id);

  if (authUserError || !authUserData.user) {
    return jsonResponse({ error: "Usuário de autenticação do laboratório não encontrado." }, 404);
  }

  const currentEmail = (authUserData.user.email ?? accountProfile.email ?? "")
    .trim()
    .toLowerCase();

  if (payload.operation === "update_email") {
    const email = payload.email.trim().toLowerCase();

    if (!isValidEmail(email)) {
      return jsonResponse({ error: "Informe um e-mail válido." }, 400);
    }
    if (email === currentEmail) {
      return jsonResponse({ error: "O novo e-mail é igual ao e-mail atual." }, 400);
    }

    const { error: updateError } = await service.auth.admin.updateUserById(
      accountProfile.id,
      {
        email,
        email_confirm: true,
      },
    );

    if (updateError) {
      return jsonResponse({ error: translateAuthError(updateError.message) }, 400);
    }

    const { error: auditError } = await service.from("audit_logs").insert({
      actor_user_id: caller.id,
      actor_role: "admin",
      laboratory_id: payload.laboratoryId,
      action: "admin_update",
      entity_type: "laboratory_account",
      entity_id: accountProfile.id,
      before_data: { email: currentEmail },
      after_data: { email },
      metadata: { operation: "email_change" },
    });

    if (auditError) {
      const { error: rollbackError } = await service.auth.admin.updateUserById(
        accountProfile.id,
        {
          email: currentEmail,
          email_confirm: true,
        },
      );

      if (rollbackError) {
        return jsonResponse(
          {
            error:
              "O e-mail foi alterado, mas houve falha ao registrar a auditoria e ao restaurar o valor anterior. Verifique a conta no Supabase antes de continuar.",
          },
          500,
        );
      }

      return jsonResponse(
        { error: "Não foi possível registrar a alteração com segurança. O e-mail anterior foi restaurado." },
        500,
      );
    }

    return jsonResponse({
      laboratoryId: payload.laboratoryId,
      userId: accountProfile.id,
      email,
    });
  }

  if (!payload.password || !hasStrongPassword(payload.password)) {
    return jsonResponse({ error: PASSWORD_POLICY_MESSAGE }, 400);
  }

  const { error: passwordError } = await service.auth.admin.updateUserById(
    accountProfile.id,
    { password: payload.password },
  );

  if (passwordError) {
    return jsonResponse({ error: translateAuthError(passwordError.message) }, 400);
  }

  const { error: auditError } = await service.from("audit_logs").insert({
    actor_user_id: caller.id,
    actor_role: "admin",
    laboratory_id: payload.laboratoryId,
    action: "admin_update",
    entity_type: "laboratory_account",
    entity_id: accountProfile.id,
    before_data: { password_changed: false },
    after_data: { password_changed: true },
    metadata: { operation: "password_reset" },
  });

  if (auditError) {
    return jsonResponse(
      {
        success: true,
        warning:
          "A senha foi redefinida, mas não foi possível registrar esta ação na auditoria. Verifique os logs administrativos.",
        laboratoryId: payload.laboratoryId,
        userId: accountProfile.id,
      },
      200,
    );
  }

  return jsonResponse({
    laboratoryId: payload.laboratoryId,
    userId: accountProfile.id,
    passwordChanged: true,
  });
});
