const RECOVERY_SESSION_KEY = "lab-plan-password-recovery";

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function isPasswordRecoveryCallbackUrl() {
  if (typeof window === "undefined") return false;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);

  return hashParams.get("type") === "recovery" || queryParams.get("type") === "recovery";
}

export function markPasswordRecoveryContext() {
  if (!storageAvailable()) return;
  window.sessionStorage.setItem(RECOVERY_SESSION_KEY, "1");
}

export function hasPasswordRecoveryContext() {
  if (!storageAvailable()) return false;
  return window.sessionStorage.getItem(RECOVERY_SESSION_KEY) === "1";
}

export function clearPasswordRecoveryContext() {
  if (!storageAvailable()) return;
  window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
}

/**
 * Deve ser executado antes de createClient().
 *
 * O Supabase pode consumir o fragmento de recuperação durante a
 * inicialização do cliente. Persistir o marcador antes disso evita perder
 * o contexto caso PASSWORD_RECOVERY seja emitido antes da montagem da rota.
 */
export function capturePasswordRecoveryContextFromUrl() {
  if (!isPasswordRecoveryCallbackUrl()) return;

  markPasswordRecoveryContext();

  if (typeof window === "undefined" || window.location.pathname === "/redefinir-senha") {
    return;
  }

  const nextUrl = `/redefinir-senha${window.location.search}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}
