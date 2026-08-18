import Link from "next/link";

import { getDashboardContext } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassBadge } from "@/components/ui/glass-badge";
import { PrimaryButton } from "@/components/ui/primary-button";

export const dynamic = "force-dynamic";

export default async function ConversasPage() {
  const { client, supabase } = await getDashboardContext();

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Conversas" />
        <EmptyState
          title="Sem negócio configurado"
          description="Configure seu negócio para acompanhar as conversas do WhatsApp."
          action={
            <Link href="/dashboard/setup">
              <PrimaryButton>Ir para o Setup</PrimaryButton>
            </Link>
          }
        />
      </div>
    );
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("client_id", client.id)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[conversas]", error);
  }

  const items = conversations ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversas"
        description="Atendimentos recebidos pelo WhatsApp."
      />

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa ainda"
          description="Quando clientes iniciarem conversas com seu número, elas aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const lastMessage = Array.isArray(c.messages)
              ? (c.messages as { role?: string; content?: string }[]).at(-1)
              : undefined;

            return (
              <GlassCard key={c.id} hover className="p-4 sm:p-5">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium tracking-tight">{c.customer_phone}</p>
                    <p className="truncate text-sm leading-6 text-muted-foreground">
                      {lastMessage?.content ||
                        "Conversa sem mensagens de texto"}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground/70">
                      {new Date(c.last_message_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <GlassBadge tone="blue" className="shrink-0">WhatsApp</GlassBadge>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
