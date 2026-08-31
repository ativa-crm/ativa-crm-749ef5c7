import { createClient } from "@supabase/supabase-js";

// Chave publicável (segura no front-end). Nunca usar a service_role aqui.
const SUPABASE_URL = "https://rgxznheljwzswihtkyau.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dNAgrBYp8u22xqTs3Csc8A_w_GDZKOC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
