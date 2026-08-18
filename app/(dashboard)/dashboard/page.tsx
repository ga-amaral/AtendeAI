import Link from "next/link";
import { CalendarDays, MessagesSquare, Users, Clock } from "lucide-react";

import { getDashboardContext } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassBadge } from "@/components/ui/glass-badge";
import { PrimaryButton } from "@/components/ui/primary-button";

export const dynamic = "force-dynamic";

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

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [todayResult, upcomingResult, conversationsResult, promptsResult] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .in("status", ["scheduled", "confirmed"])
        .gte("starts_at", startOfDay.toISOString())
        .lt("starts_at", endOfDay.toISOString()),
      supabase
        .from("appointments")
        .select("*")
        .eq("client_id", client.id)
        .in("status", ["scheduled", "confirmed"])
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("client_id", client.id)
        .eq("status", "open"),
      supabase
        .from("attendance_prompts")
        .select("id")
        .eq("client_id", client.id)
        .eq("is_active", true),
    ]);

  const appointments = upcomingResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Visão geral de ${client.name}.`}
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
          hint="agendamentos confirmados"
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="Próximos"
          value={appointments.length}
          hint="nos próximos registros"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="Conversas abertas"
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
                    {new Date(a.starts_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
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