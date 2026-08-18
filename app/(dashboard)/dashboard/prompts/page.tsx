import Link from "next/link";

import { getDashboardContext } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassBadge } from "@/components/ui/glass-badge";
import { PrimaryButton } from "@/components/ui/primary-button";
import { PromptForm } from "@/components/dashboard/prompt-form";
import { PromptActivate } from "@/components/dashboard/prompt-activate";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const { client, supabase } = await getDashboardContext();

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader title="Prompts" />
        <EmptyState
          title="Sem negócio configurado"
          description="Configure seu negócio para gerenciar os prompts do assistente."
          action={
            <Link href="/dashboard/setup">
              <PrimaryButton>Ir para o Setup</PrimaryButton>
            </Link>
          }
        />
      </div>
    );
  }

  const { data: prompts, error } = await supabase
    .from("attendance_prompts")
    .select("*")
    .eq("client_id", client.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[prompts]", error);
  }

  const items = prompts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompts"
        description="Defina como o assistente de IA conversa com seus clientes."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-4 font-semibold">Criar novo prompt</h2>
          <PromptForm clientId={client.id} />
        </GlassCard>

        <div className="space-y-3">
          <h2 className="font-semibold">Prompts existentes</h2>
          {items.length === 0 ? (
            <EmptyState
              title="Nenhum prompt criado"
              description="Crie um prompt para o assistente saber como atender."
            />
          ) : (
            items.map((p) => (
              <GlassCard key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        Prompt v{p.version}
                      </p>
                      <GlassBadge tone={p.active ? "green" : "muted"}>
                        {p.active ? "Ativo" : "Inativo"}
                      </GlassBadge>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {p.system_prompt}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Atualizado em{" "}
                      {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <PromptActivate
                    promptId={p.id}
                    clientId={client.id}
                    active={p.active}
                  />
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}