"use client";

import * as React from "react";

import { createClient } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface LastMessage {
  role?: string;
  content?: string;
}

function lastMessageText(conversation: Conversation): string {
  if (!Array.isArray(conversation.messages)) return "";
  const last = conversation.messages.at(-1) as LastMessage | undefined;
  return last?.content ?? "";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

interface ConversationFeedProps {
  clientId: string;
  initial: Conversation[];
  limit?: number;
  className?: string;
}

function ConversationFeed({
  clientId,
  initial,
  limit = 6,
  className,
}: ConversationFeedProps) {
  const [conversations, setConversations] =
    React.useState<Conversation[]>(initial);

  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`dashboard-conversations-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const next = payload.new as Conversation;
          if (!next?.id) return;
          setConversations((prev) => {
            const without = prev.filter((c) => c.id !== next.id);
            return [next, ...without]
              .sort(
                (a, b) =>
                  new Date(b.last_message_at).getTime() -
                  new Date(a.last_message_at).getTime()
              )
              .slice(0, limit);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, limit]);

  return (
    <GlassCard className={cn("flex h-full flex-col p-5", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Conversas ao vivo</h2>
          <GlassBadge tone="green" className="gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Ao vivo
          </GlassBadge>
        </div>
        <span className="text-xs text-muted-foreground">
          {conversations.length} {conversations.length === 1 ? "conversa" : "conversas"}
        </span>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          className="flex-1"
          title="Nenhuma conversa ainda"
          description="Quando clientes iniciarem conversas com seu número, elas aparecerão aqui em tempo real."
        />
      ) : (
        <ul className="flex-1 space-y-2.5 overflow-y-auto">
          {conversations.map((c, index) => (
            <li
              key={c.id}
              className={cn(
                "group flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors duration-300 hover:border-white/10 hover:bg-white/[0.05]",
                index === 0 && "border-violet-400/20 bg-violet-500/[0.06]"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  {c.customer_phone}
                </p>
                <p
                  className={cn(
                    "truncate text-sm text-muted-foreground",
                    index === 0 && "text-violet-200/80"
                  )}
                >
                  {lastMessageText(c) || "Conversa sem mensagens de texto"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {timeAgo(c.last_message_at)}
                </span>
                <GlassBadge tone="blue">WhatsApp</GlassBadge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

export { ConversationFeed };