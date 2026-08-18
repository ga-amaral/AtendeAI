import Link from "next/link";
import { CalendarDays, MessagesSquare, Users, Clock } from "lucide-react";

import { getDashboardContext } from "@/lib/dashboard";
import { DEFAULT_TIMEZONE } from "@/lib/domain/tenants";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassBadge } from "@/components/ui/glass-badge";
import { PrimaryButton } from "@/components/ui/primary-button";
import type { Appointment } from "@/types";

export const dynamic = "force-dynamic";

function formatAppointment(a: Appointment): string {
  return new Date(`${a.date}T${a.time}:00`).toLocaleString("pt-BR", {
    timeZone: DEFAULT_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function DashboardPage() {
  const { client, supabase } = await getDashboardContext();

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Bem-vindo ao AgendamentoIA!"
        />
        <EmptyState
          title="Seu negócio ainda não está configurado"
          description="Crie seus serviços, horários de funcionamento e conecte sua instância da Evolution API para ativar o assistente."
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

  const [todayResult, upcomingResult, conversationsResult, promptsResult] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("date", todayLocal)
        .in("status", ["scheduled", "confirmed"]),
      supabase
        .from("appointments")
        .select("*")
        .eq("client_id", client.id)
        .in("status", ["scheduled", "confirmed"])
        .gte("date", todayLocal)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(10),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id),
      supabase
        .from("attendance_prompts")
        .select("id")
        .eq("client_id", client.id)
        .eq("active", true),
    ]);

  const now = new Date();
  const appointments = (upcomingResult.data ?? []).filter((a: Appointment) => {
    const dt = new Date(`${a.date}T${a.time}:00`);
    return dt >= now;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Visão geral de ${client.business_name}.`}
        actions={
          <Link href="/dashboard/agenda">
            <PrimaryButton>Ver agenda</PrimaryButton>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Hoje"
          value={todayResult.count ?? 0}
          hint="agendamentos no dia"
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="Próximos"
          value={appointments.length}
          hint="agendamentos futuros"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="Conversas"
          value={conversationsResult.count ?? 0}
          hint="no WhatsApp"
          icon={<MessagesSquare className="size-5" />}
        />
        <StatCard
          label="IA ativa"
          value={(promptsResult.data?.length ?? 0) > 0 ? "Sim" : "Não"}
          hint="prompt ativo configurado"
          icon={<Users className="size-5" />}
        />
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 font-semibold">Próximos agendamentos</h2>
        {appointments.length === 0 ? (
          <EmptyState
            title="Nenhum agendamento próximo"
            description="Quando clientes agendarem pelo WhatsApp, eles aparecerão aqui."
          />
        ) : (
          <ul className="space-y-3">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5"
              >
                <div>
                  <p className="font-medium">{a.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAppointment(a)}
                  </p>
                </div>
                <GlassBadge tone="violet">{a.status}</GlassBadge>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}