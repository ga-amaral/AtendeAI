import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendTextMessage } from "@/lib/evolution";
import { DEFAULT_TIMEZONE } from "@/lib/domain/tenants";
import type { Appointment, Client } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMINDER_MARK = "reminder_sent_at";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function parseReminder(notes: string | null): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return typeof parsed[REMINDER_MARK] === "string"
      ? (parsed[REMINDER_MARK] as string)
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowHours = Number(process.env.REMINDER_WINDOW_HOURS ?? 24);
  const now = new Date();

  // Busca um dia a mais para compensar diferenças de fuso; o filtro
  // preciso (por datetime combinado) é feito em memória.
  const todayLocal = now.toLocaleDateString("en-CA", { timeZone: DEFAULT_TIMEZONE });
  const upperBound = new Date(now.getTime() + (windowHours + 48) * 60 * 60 * 1000)
    .toLocaleDateString("en-CA", { timeZone: DEFAULT_TIMEZONE });

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("appointments")
      .select("*, clients!inner(id, business_name, evolution_instance_name, evolution_api_key)")
      .in("status", ["scheduled", "confirmed"])
      .gte("date", todayLocal)
      .lte("date", upperBound)
      .order("date", { ascending: true })
      .limit(500);

    if (error) throw error;

    const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    let sent = 0;
    const failures: string[] = [];

    for (const row of (rows ?? []) as (Appointment & {
      clients: Pick<Client, "business_name" | "evolution_instance_name" | "evolution_api_key">;
    })[]) {
      const client = row.clients;
      if (!client?.evolution_instance_name) {
        failures.push(row.id);
        continue;
      }

      const startsAt = new Date(`${row.date}T${row.time}:00`);
      if (Number.isNaN(startsAt.getTime())) {
        failures.push(row.id);
        continue;
      }

      // Envia apenas agendamentos dentro da janela e ainda não lembrados.
      if (startsAt <= now || startsAt > windowEnd) continue;
      if (parseReminder(row.notes)) continue;

      const formatted = startsAt.toLocaleString("pt-BR", {
        timeZone: DEFAULT_TIMEZONE,
        dateStyle: "short",
        timeStyle: "short",
      });

      const text = `Olá, ${row.customer_name}! Lembrete: seu agendamento com ${client.business_name} está marcado para ${formatted}. Até já!`;

      try {
        await sendTextMessage(
          client.evolution_instance_name,
          row.customer_phone,
          text,
          client.evolution_api_key ?? undefined
        );

        const baseNotes = parseReminder(row.notes)
          ? {}
          : (() => {
              try {
                return row.notes ? (JSON.parse(row.notes) as Record<string, unknown>) : {};
              } catch {
                return {};
              }
            })();

        const { error: updateError } = await supabaseAdmin
          .from("appointments")
          .update({
            notes: JSON.stringify({ ...baseNotes, [REMINDER_MARK]: now.toISOString() }),
          })
          .eq("id", row.id);

        if (updateError) {
          failures.push(row.id);
          continue;
        }
        sent += 1;
      } catch (err) {
        console.error("[reminders] falha ao enviar", row.id, err);
        failures.push(row.id);
      }
    }

    return NextResponse.json({ ok: true, sent, failures });
  } catch (error) {
    console.error("[reminders]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}