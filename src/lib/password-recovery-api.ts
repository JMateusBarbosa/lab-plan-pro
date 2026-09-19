import { supabase } from "@/lib/supabase";
import { hasStrongPassword, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";
import {
  clearPasswordRecoveryContext,
  hasPasswordRecoveryContext,
  markPasswordRecoveryContext,
} from "@/lib/password-recovery-context";

export type RecoveryAccountRole = "admin" | "laboratory" | null;

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
  if (!hasPasswordRecoveryContext()) return false;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return false;

  return true;
}

export function subscribeToRecoverySession(onReady: () => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (!session) return;

    if (event === "PASSWORD_RECOVERY") {
      markPasswordRecoveryContext();
      onReady();
      return;
    }

    if (
      (event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED") &&
      hasPasswordRecoveryContext()
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

  // Encerra as sessões e confirma que a sessão local realmente foi removida.
  // O método signOut resolve com { error }, então o retorno precisa ser inspecionado.
  const { error: globalSignOutError } = await supabase.auth.signOut({ scope: "global" });
  const { data: sessionAfterGlobal } = await supabase.auth.getSession();

  if (globalSignOutError || sessionAfterGlobal.session) {
    const { error: localSignOutError } = await supabase.auth.signOut({ scope: "local" });

    if (localSignOutError) {
      throw new Error(
        "A senha foi atualizada, mas não foi possível encerrar a sessão com segurança. Feche esta aba e entre novamente.",
      );
    }
  }

  const { data: finalSession, error: finalSessionError } = await supabase.auth.getSession();
  if (finalSessionError || finalSession.session) {
    throw new Error(
      "A senha foi atualizada, mas a sessão ainda está ativa. Feche esta aba e entre novamente.",
    );
  }

  clearPasswordRecoveryContext();

  return role;
}
