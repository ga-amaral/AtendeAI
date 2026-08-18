"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function cancel() {
    if (!confirm("Cancelar este agendamento?")) return;
    await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={cancel}>
      Cancelar
    </Button>
  );
}