import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Appointment, AvailableSlot, Service } from "@/types";

const SLOT_STEP_MINUTES = 30;

export class DomainError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function getTzOffsetMinutes(dateStr: string, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(`${dateStr}T12:00:00Z`));
  const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(offset);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] ?? "0", 10);
  return sign * (hours * 60 + minutes);
}

function zonedDate(dateStr: string, timezone: string, time = "00:00:00"): Date {
  const offset = getTzOffsetMinutes(dateStr, timezone);
  const [h, m, s = "00"] = time.split(":");
  const asUtc = Date.UTC(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(5, 7), 10) - 1,
    parseInt(dateStr.slice(8, 10), 10),
    parseInt(h, 10),
    parseInt(m, 10),
    parseInt(s, 10)
  );
  return new Date(asUtc - offset * 60000);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

async function findServiceByName(
  clientId: string,
  serviceName: string
): Promise<Service | null> {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("client_id", clientId)
    .ilike("name", serviceName.trim())
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getExistingAppointments(
  clientId: string,
  dayStart: string,
  dayEnd: string
): Promise<Appointment[]> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("client_id", clientId)
    .in("status", ["scheduled", "confirmed"])
    .gte("starts_at", dayStart)
    .lt("starts_at", dayEnd);

  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Retorna os slots livres para um serviço em uma data, respeitando
 * working_hours do tenant e os agendamentos já existentes.
 */
export async function checkAvailability(
  clientId: string,
  serviceName: string,
  date: string,
  timezone: string
): Promise<AvailableSlot[]> {
  const service = await findServiceByName(clientId, serviceName);
  if (!service) {
    throw new DomainError("SERVICE_NOT_FOUND", `Serviço "${serviceName}" não encontrado.`);
  }

  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();

  const { data: hours, error } = await supabaseAdmin
    .from("working_hours")
    .select("*")
    .eq("client_id", clientId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_available", true);

  if (error) throw error;

  const dayStart = zonedDate(date, timezone);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const existing = await getExistingAppointments(
    clientId,
    dayStart.toISOString(),
    dayEnd.toISOString()
  );

  const slots: AvailableSlot[] = [];

  for (const wh of hours ?? []) {
    const startMin = timeToMinutes(wh.start_time);
    const endMin = timeToMinutes(wh.end_time);
    const lastStart = endMin - service.duration_minutes;

    for (let t = startMin; t <= lastStart; t += SLOT_STEP_MINUTES) {
      const slotStart = new Date(
        dayStart.getTime() + t * 60 * 1000
      );
      const slotEnd = new Date(
        slotStart.getTime() + service.duration_minutes * 60 * 1000
      );

      const conflict = existing.some((appt) =>
        overlaps(
          slotStart,
          slotEnd,
          new Date(appt.starts_at),
          new Date(appt.ends_at)
        )
      );

      if (!conflict) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          start_time: minutesToTime(t),
          end_time: minutesToTime(t + service.duration_minutes),
        });
      }
    }
  }

  return slots;
}

/**
 * Cria um agendamento validando conflito de horário dentro do tenant.
 */
export async function createAppointment(params: {
  clientId: string;
  serviceName: string;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  timezone: string;
}): Promise<Appointment> {
  const service = await findServiceByName(params.clientId, params.serviceName);
  if (!service) {
    throw new DomainError("SERVICE_NOT_FOUND", `Serviço "${params.serviceName}" não encontrado.`);
  }

  const startsAt = new Date(params.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    throw new DomainError("INVALID_DATE", "Data de início inválida.");
  }

  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60 * 1000);

  const dayStart = new Date(
    startsAt.getFullYear(),
    startsAt.getMonth(),
    startsAt.getDate()
  );
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const existing = await getExistingAppointments(
    params.clientId,
    dayStart.toISOString(),
    dayEnd.toISOString()
  );

  const conflict = existing.find((appt) =>
    overlaps(startsAt, endsAt, new Date(appt.starts_at), new Date(appt.ends_at))
  );

  if (conflict) {
    throw new DomainError(
      "CONFLICT",
      "O horário solicitado não está mais disponível."
    );
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      client_id: params.clientId,
      service_id: service.id,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new DomainError("CONFLICT", "O horário solicitado não está mais disponível.");
    }
    throw error;
  }

  return data as Appointment;
}

/**
 * Cancela um agendamento do tenant localizado por serviço/horário/cliente.
 */
export async function cancelAppointment(params: {
  clientId: string;
  serviceName: string;
  startsAt: string;
  customerPhone: string;
  timezone: string;
}): Promise<Appointment> {
  const service = await findServiceByName(params.clientId, params.serviceName);
  if (!service) {
    throw new DomainError("SERVICE_NOT_FOUND", `Serviço "${params.serviceName}" não encontrado.`);
  }

  const startsAt = new Date(params.startsAt);
  const startIso = startsAt.toISOString();
  const endIso = new Date(
    startsAt.getTime() + service.duration_minutes * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("client_id", params.clientId)
    .eq("service_id", service.id)
    .eq("customer_phone", params.customerPhone.replace(/\D/g, ""))
    .gte("starts_at", startIso)
    .lt("starts_at", endIso)
    .in("status", ["scheduled", "confirmed"])
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new DomainError("NOT_FOUND", "Agendamento não encontrado para cancelamento.");
  }

  return data as Appointment;
}