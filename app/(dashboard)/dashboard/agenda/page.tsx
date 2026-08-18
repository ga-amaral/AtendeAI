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

      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Proximos horarios</p>
            <h2 className="font-semibold tracking-tight">Agendamentos futuros</h2>
          </div>
          {upcoming.length > 0 && <span className="font-mono text-xs text-muted-foreground">{upcoming.length} na fila</span>}
        </div>
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
                className="surface-inset flex flex-col items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.045] sm:flex-row sm:items-center sm:gap-4"
              >
                <div>
                  <p className="font-medium tracking-tight">{a.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAppointment(a)}
                  </p>
                </div>
                <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
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
        <GlassCard className="p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Histórico recente</h2>
          <ul className="space-y-3">
            {past.map((a) => (
              <li
                key={a.id}
                className="surface-inset flex flex-col items-start justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
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
