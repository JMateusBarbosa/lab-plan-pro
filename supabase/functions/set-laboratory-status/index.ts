import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  corsHeadersForRequest,
  handleCorsPreflight,
  isOriginAllowed,
} from "../_shared/cors.ts";

type StatusPayload = {
  laboratoryId: string;
  status: "ativo" | "inativo";
};

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
  if (userError || !userData.user) {
    return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return jsonResponse({ error: "Apenas administradores podem alterar o status de laboratórios." }, 403);
  }

  let payload: StatusPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
  }

  if (!payload?.laboratoryId || !["ativo", "inativo"].includes(payload.status)) {
    return jsonResponse({ error: "Dados de status inválidos." }, 400);
  }

  const { data: laboratory, error: laboratoryError } = await service
    .from("laboratories")
    .update({ status: payload.status })
    .eq("id", payload.laboratoryId)
    .select("id, status")
    .maybeSingle();

  if (laboratoryError) {
    return jsonResponse({ error: "Não foi possível alterar o status do laboratório." }, 500);
  }
  if (!laboratory) {
    return jsonResponse({ error: "Laboratório não encontrado." }, 404);
  }

  return jsonResponse({ laboratoryId: laboratory.id, status: laboratory.status });
});
