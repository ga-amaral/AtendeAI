import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Client } from "@/types";

/** Fuso padrão usado quando o client não expõe timezone (schema atual não possui coluna). */
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/** Resolve o tenant (clients) de um usuário autenticado. */
export async function getClientForUser(userId: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Resolve o tenant (clients) a partir do nome da instância Evolution. */
export async function getClientByInstance(instance: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("evolution_instance_name", instance)
    .maybeSingle();

  if (error) throw error;
  return data;
}