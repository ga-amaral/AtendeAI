import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Client } from "@/types";

/** Resolve o tenant (clients) de um usuário autenticado. */
export async function getClientForUser(userId: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Resolve o tenant (clients) a partir do nome da instância Evolution. */
export async function getClientByInstance(instance: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("evolution_instance", instance)
    .maybeSingle();

  if (error) throw error;
  return data;
}