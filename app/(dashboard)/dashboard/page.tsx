import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MessagesSquare,
  Sparkles,
} from "lucide-react";

import { getDashboardContext } from "@/lib/dashboard";
import { DEFAULT_TIMEZONE } from "@/lib/domain/tenants";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AIOrb } from "@/components/dashboard/ai-orb";
import { ConversationFeed } from "@/components/dashboard/conversation-feed";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentStatus, Conversation } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_TONE: Record<
  AppointmentStatus,
  "violet" | "green" | "blue" | "red"
> = {
  scheduled: "violet",
  confirmed: "green",
  completed: "blue",
  cancelled: "red",
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  scheduled: "bg-violet-400 ring-violet-400/20",
  confirmed: "bg-emerald-400 ring-emerald-400/20",
  completed: "bg-blue-400 ring-blue-400/20",
  cancelled: "bg-red-400 ring-red-400/20",
};

function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function DashboardPage() {
  const { client, supabase } = await getDashboardContext();

  if (!client) {
    return (
      <div className="space-y-6">
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
  const todayLocal = now.toLocaleDateString("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
  });

  const [
    todayResult,
    upcomingResult,
    conversationsResult,
    conversationsCountResult,
    promptsResult,
    servicesResult,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("client_id", client.id)
      .eq("date", todayLocal)
      .in("status", ["scheduled", "confirmed"])
      .order("time", { ascending: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("date", todayLocal),
    supabase
      .from("conversations")
      .select("*")
      .eq("client_id", client.id)
      .order("last_message_at", { ascending: false })
      .limit(6),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id),
    supabase
      .from("attendance_prompts")
      .select("id")
      .eq("client_id", client.id)
      .eq("active", true),
    supabase
      .from("services")
      .select("id, name")
      .eq("client_id", client.id),
  ]);

  const todayAppts = (todayResult.data ?? []) as Appointment[];
  const upcomingCount = upcomingResult.count ?? 0;
  const conversations = (conversationsResult.data ?? []) as Conversation[];
  const conversationCount = conversationsCountResult.count ?? 0;
  const promptActive = (promptsResult.data?.length ?? 0) > 0;
  const serviceNameById = new Map(
    (servicesResult.data ?? []).map((s) => [s.id, s.name])
  );
  const lastActivityAt = conversations[0]?.last_message_at ?? null;

  const dateStr = capitalize(
    now.toLocaleDateString("pt-BR", {
      timeZone: DEFAULT_TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  );

  const nowTime = now.toTimeString().slice(0, 5);
  const nextIndex = todayAppts.findIndex((a) => a.time >= nowTime);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      <GlassCard className="bg-ambient-hero relative overflow-hidden p-6 sm:p-8 md:col-span-2 lg:col-span-7">
        <div
          className="pointer-events-none absolute inset-0 bg-grid-faint opacity-60"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-violet-600/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 max-w-xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone="violet" className="gap-1.5">
                <Sparkles className="size-3.5" />
                Assistente de IA · {client.openai_model ?? "GPT-4o"}
              </GlassBadge>
              <GlassBadge tone={promptActive ? "green" : "muted"}>
                {promptActive ? "IA ativa" : "IA inativa"}
              </GlassBadge>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {greetingFor(now)}!{" "}
                <span className="text-gradient">
                  Sou a IA da {client.business_name}.
                </span>
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {dateStr}. {todayAppts.length} agendamento
                {todayAppts.length === 1 ? "" : "s"} hoje e {conversationCount}{" "}
                conversa{conversationCount === 1 ? "" : "s"} em andamento.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {client.evolution_instance_name && (
                <GlassBadge tone="blue">
                  {client.evolution_instance_name}
                </GlassBadge>
              )}
              {client.segment && (
                <GlassBadge tone="default">{client.segment}</GlassBadge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/dashboard/agenda">
                <PrimaryButton>
                  Ver agenda
                  <ArrowRight />
                </PrimaryButton>
              </Link>
              <Link href="/dashboard/conversas">
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl px-4 text-sm text-violet-200 hover:bg-white/5 hover:text-white"
                >
                  Abrir conversas
                </Button>
              </Link>
            </div>
          </div>

          <AIOrb lastActivityAt={lastActivityAt} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:col-span-5">
        <StatCard
          label="Hoje"
          value={todayAppts.length}
          hint="agendamentos no dia"
          tone="violet"
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="Próximos"
          value={upcomingCount}
          hint="agendamentos futuros"
          tone="blue"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="Conversas"
          value={conversationCount}
          hint="no WhatsApp"
          tone="green"
          icon={<MessagesSquare className="size-5" />}
        />
        <StatCard
          label="IA ativa"
          value={promptActive ? "Sim" : "Não"}
          hint="prompt ativo configurado"
          tone="amber"
          icon={<Sparkles className="size-5" />}
        />
      </div>

      <ConversationFeed
        clientId={client.id}
        initial={conversations}
        className="lg:col-span-7"
      />

      <GlassCard className="flex h-full flex-col p-5 lg:col-span-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="eyebrow">Agenda</p>
            <h2 className="mt-1 font-semibold">Agenda de hoje</h2>
          </div>
          <Link
            href="/dashboard/agenda"
            className="text-sm text-violet-300 transition-colors hover:text-violet-200"
          >
            Todas
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <EmptyState
            className="flex-1"
            title="Sem agendamentos hoje"
            description="Novos agendamentos feitos pelo WhatsApp aparecem aqui."
          />
        ) : (
          <div className="relative mt-2 flex-1">
            <div
              className="absolute bottom-1 left-[7px] top-1 w-px bg-gradient-to-b from-violet-500/60 via-blue-500/40 to-transparent"
              aria-hidden
            />
            <ol className="space-y-4">
              {todayAppts.map((a, index) => {
                const serviceName = a.service_id
                  ? serviceNameById.get(a.service_id)
                  : undefined;
                const isNext = index === nextIndex;
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "relative rounded-xl px-2 py-2 pl-7 sm:px-3",
                      isNext &&
                        "border border-violet-400/20 bg-violet-500/[0.06]"
                    )}
                  >
                    <span className="absolute left-0 top-1/2 flex size-3.5 -translate-y-1/2 items-center justify-center">
                      <span
                        className={cn(
                          "size-2.5 rounded-full ring-4",
                          STATUS_DOT[a.status]
                        )}
                      />
                    </span>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {a.customer_name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {serviceName ?? "Sem serviço definido"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums text-violet-200">
                          {a.time}
                        </span>
                        <GlassBadge tone={STATUS_TONE[a.status]}>
                          {STATUS_LABEL[a.status]}
                        </GlassBadge>
                        {isNext && (
                          <GlassBadge
                            tone="violet"
                            className="hidden sm:inline-flex"
                          >
                            Próximo
                          </GlassBadge>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </GlassCard>
    </div>
  );
}