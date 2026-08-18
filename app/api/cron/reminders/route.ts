import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendTextMessage } from "@/lib/evolution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowHours = Number(process.env.REMINDER_WINDOW_HOURS ?? 24);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

  try {
    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .in("status", ["scheduled", "confirmed"])
      .is("reminder_sent_at", null)
      .gte("starts_at", now.toISOString())
      .lt("starts_at", windowEnd.toISOString());

    if (error) throw error;

    let sent = 0;
    const failures: string[] = [];

    for (const appointment of appointments ?? []) {
      const { data: client, error: clientError } = await supabaseAdmin
        .from("clients")
        .select("name, evolution_instance, timezone")
        .eq("id", appointment.client_id)
        .maybeSingle();

      if (clientError || !client?.evolution_instance) {
        failures.push(appointment.id);
        continue;
      }

      const startsAt = new Date(appointment.starts_at).toLocaleString("pt-BR", {
        timeZone: client.timezone,
        dateStyle: "short",
        timeStyle: "short",
      });

      const text = `Olá, ${appointment.customer_name}! Lembrete: seu agendamento com ${client.name} está marcado para ${startsAt}. Até já!`;

      try {
        await sendTextMessage(client.evolution_instance, appointment.customer_phone, text);
        const { error: updateError } = await supabaseAdmin
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", appointment.id);
        if (updateError) {
          failures.push(appointment.id);
          continue;
        }
        sent += 1;
      } catch (err) {
        console.error("[reminders] falha ao enviar", appointment.id, err);
        failures.push(appointment.id);
      }
    }

    return NextResponse.json({ ok: true, sent, failures });
  } catch (error) {
    console.error("[reminders]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}