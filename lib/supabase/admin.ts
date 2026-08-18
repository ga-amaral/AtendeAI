import "server-only";

import { createClient } from "@supabase/supabase-js";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente do servidor.");
}

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada no ambiente do servidor.");
}

/**
 * Cliente com permissões administrativas (bypass de RLS).
 *
 * ATENÇÃO: Só pode ser importado e usado em API routes / código server-side.
 * Nunca importe este módulo de um Client Component ou de código do browser.
 */
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});