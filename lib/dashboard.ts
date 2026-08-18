import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/types";

export interface DashboardContext {
  user: { id: string; email?: string } | null;
  client: Client | null;
  supabase: ReturnType<typeof createClient>;
}

export async function getDashboardContext(): Promise<DashboardContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, client: null, supabase };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, client: (client as Client) ?? null, supabase };
}