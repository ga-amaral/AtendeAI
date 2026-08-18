"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function PromptActivate({
  promptId,
  clientId,
  active,
}: {
  promptId: string;
  clientId: string;
  active: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function toggle() {
    if (active) {
      await supabase
        .from("attendance_prompts")
        .update({ active: false })
        .eq("id", promptId);
    } else {
      // Ativa apenas este prompt para o tenant.
      await supabase
        .from("attendance_prompts")
        .update({ active: false })
        .eq("client_id", clientId);
      await supabase
        .from("attendance_prompts")
        .update({ active: true })
        .eq("id", promptId);
    }
    router.refresh();
  }

  return (
    <Button variant={active ? "default" : "outline"} size="sm" onClick={toggle}>
      {active ? "Ativo" : "Ativar"}
    </Button>
  );
}