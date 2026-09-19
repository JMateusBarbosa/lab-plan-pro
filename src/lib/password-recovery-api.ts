import { supabase } from "@/lib/supabase";
import { hasStrongPassword, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";

export type RecoveryAccountRole = "admin" | "laboratory" | null;

const RECOVERY_SESSION_KEY = "lab-plan-password-recovery";

function isRecoveryCallbackUrl() {
  if (typeof window === "undefined") return false;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);

  return hashParams.get("type") === "recovery" || queryParams.get("type") === "recovery";
}

function markRecoverySession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(RECOVERY_SESSION_KEY, "1");
}

function clearRecoverySessionMarker() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
}

export async function requestPasswordRecovery(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Informe o e-mail da conta.");
  }

  const redirectTo = new URL("/redefinir-senha", window.location.origin).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

  if (!error) return;

  if (error.status === 429) {
    throw new Error("Muitas solicitações em pouco tempo. Aguarde um minuto e tente novamente.");
  }

  throw new Error("Não foi possível enviar o e-mail de recuperação agora. Tente novamente.");
}

export async function hasRecoverySession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return false;

  if (isRecoveryCallbackUrl()) {
    markRecoverySession();
    return true;
  }

  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(RECOVERY_SESSION_KEY) === "1"
  );
}

export function subscribeToRecoverySession(onReady: () => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (!session) return;

    if (event === "PASSWORD_RECOVERY") {
      markRecoverySession();
      onReady();
      return;
    }

    if (
      (event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED") &&
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(RECOVERY_SESSION_KEY) === "1"
    ) {
      onReady();
    }
  });

  return () => subscription.unsubscribe();
}

async function getCurrentAccountRole(): Promise<RecoveryAccountRole> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin" || profile?.role === "laboratory") {
    return profile.role;
  }

  return null;
}

export async function completePasswordRecovery(password: string) {
  if (!hasStrongPassword(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }

  const role = await getCurrentAccountRole();

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("password")) {
      throw new Error(PASSWORD_POLICY_MESSAGE);
    }

    throw new Error("Não foi possível atualizar a senha. Solicite um novo link e tente novamente.");
  }

  clearRecoverySessionMarker();

  // Encerra a sessão temporária de recuperação e demais refresh tokens.
  // Access tokens antigos podem permanecer válidos até o próprio vencimento.
  await supabase.auth.signOut({ scope: "global" }).catch(() => undefined);

  return role;
}
