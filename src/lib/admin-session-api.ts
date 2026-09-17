import { supabase } from "@/lib/supabase";

export interface AdminSessionData {
  userId: string;
  email: string;
}

export async function getAdminSession(): Promise<AdminSessionData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profile || profile.role !== "admin") {
    throw new Error("Esta conta não possui acesso administrativo.");
  }

  return {
    userId: user.id,
    email: profile.email,
  };
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    const message = error?.message?.toLowerCase() ?? "";
    if (message.includes("email not confirmed")) {
      throw new Error("Seu e-mail ainda não foi confirmado.");
    }
    throw new Error("E-mail ou senha inválidos.");
  }

  try {
    return await getAdminSession();
  } catch (sessionError) {
    await supabase.auth.signOut();
    throw sessionError;
  }
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
