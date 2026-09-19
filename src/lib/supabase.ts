import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { capturePasswordRecoveryContextFromUrl } from "@/lib/password-recovery-context";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Variáveis do Supabase ausentes. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

capturePasswordRecoveryContextFromUrl();

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);
