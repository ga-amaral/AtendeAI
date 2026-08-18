import Link from "next/link";

import { getDashboardContext } from "@/lib/dashboard";
import { DEFAULT_TIMEZONE } from "@/lib/domain/tenants";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassBadge } from "@/components/ui/glass-badge";
import { PrimaryButton } from "@/components/ui/primary-button";
import { CancelAppointmentButton } from "@/components/dashboard/cancel-appointment-button";
import type { Appointment } from "@/types";

export const dynamic = "force-dynamic";

function formatAppointment(a: Appointment): string {
  return new Date(`${a.date}T${a.time}:00`).toLocaleString("pt-BR", {
    timeZone: DEFAULT_TIMEZONE,
    dateStyle: "full",
    timeStyle: "short",
  });
}

export default async function AgendaPage() {
  const { client, supabase } = await getDashboardContext();

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agenda" />
        <EmptyState
          title="Sem negócio configurado"
          description="Configure seu negócio para gerenciar a agenda."
          action={
            <Link href="/dashboard/setup">
              <PrimaryButton>Ir para o Setup</PrimaryButton>
            </Link>
          }
        />
      </div>
    );
  }

  const todayLocal = new Date().toLocaleDateString("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
  });
  const now = new Date();

  const [upcomingResult, pastResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", client.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("date", todayLocal)
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(100),
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", client.id)
      .in("status", ["cancelled", "completed"])
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(20),
  ]);

  const upcoming = (upcomingResult.data ?? []).filter((a: Appointment) => {
    const dt = new Date(`${a.date}T${a.time}:00`);
    return dt >= now;
  });
  const past = pastResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Compromissos criados pelo assistente de IA."
      />

      <GlassCard className="p-6">
        <h2 className="mb-4 font-semibold">Agendamentos futuros</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="Nenhum agendamento futuro"
            description="Agendamentos criados via WhatsApp aparecerão aqui."
          />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5"
              >
                <div>
                  <p className="font-medium">{a.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAppointment(a)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <GlassBadge
                    tone={a.status === "confirmed" ? "green" : "violet"}
                  >
                    {a.status}
                  </GlassBadge>
                  <CancelAppointmentButton appointmentId={a.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {past.length > 0 && (
        <GlassCard className="p-6">
          <h2 className="mb-4 font-semibold">Histórico recente</h2>
          <ul className="space-y-3">
            {past.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5"
              >
                <div>
                  <p className="font-medium">{a.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAppointment(a)}
                  </p>
                </div>
                <GlassBadge tone="muted">{a.status}</GlassBadge>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}