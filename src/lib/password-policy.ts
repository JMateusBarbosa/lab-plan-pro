export const PASSWORD_POLICY_MESSAGE =
  "A senha deve ter pelo menos 12 caracteres e incluir letra maiúscula, letra minúscula, número e símbolo.";

export function hasStrongPassword(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
