import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Appointment, AvailableSlot, Service, WorkingHours } from "@/types";

export { DEFAULT_TIMEZONE } from "@/lib/domain/tenants";

const SLOT_STEP_MINUTES = 30;

export class DomainError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
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

function dayOfWeek(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00Z`).getTime());
}

function isValidTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time) && timeToMinutes(time) >= 0 && timeToMinutes(time) < 24 * 60;
}

function minutesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
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
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getWorkingHours(
  clientId: string,
  date: string
): Promise<WorkingHours[]> {
  const { data, error } = await supabaseAdmin
    .from("working_hours")
    .select("*")
    .eq("client_id", clientId)
    .eq("day_of_week", dayOfWeek(date))
    .eq("is_closed", false);

  if (error) throw error;
  return (data ?? []) as WorkingHours[];
}

async function getAppointmentsOnDate(
  clientId: string,
  date: string
): Promise<Appointment[]> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("client_id", clientId)
    .eq("date", date)
    .in("status", ["scheduled", "confirmed"]);

  if (error) throw error;
  return (data ?? []) as Appointment[];
}

/** Janelas ocupadas (em minutos) dos agendamentos de uma data, usando services.duration. */
async function getOccupiedWindows(
  appointments: Appointment[]
): Promise<{ start: number; end: number }[]> {
  if (appointments.length === 0) return [];

  const serviceIds = Array.from(
    new Set(appointments.map((a) => a.service_id).filter(Boolean))
  ) as string[];
  let durations = new Map<string, number>();

  if (serviceIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id, duration")
      .in("id", serviceIds as string[]);
    if (error) throw error;
    durations = new Map((data ?? []).map((s) => [s.id, s.duration]));
  }

  return appointments.map((a) => {
    const start = timeToMinutes(a.time);
    const duration = a.service_id ? durations.get(a.service_id) : undefined;
    const end = start + (duration ?? 30);
    return { start, end };
  });
}

/**
 * Retorna os slots livres para um serviço em uma data, respeitando
 * working_hours do tenant e os agendamentos já existentes (overlap via duration).
 */
export async function checkAvailability(
  clientId: string,
  serviceName: string,
  date: string
): Promise<AvailableSlot[]> {
  if (!isValidDate(date)) {
    throw new DomainError("INVALID_DATE", "Data inválida. Use o formato YYYY-MM-DD.");
  }

  const service = await findServiceByName(clientId, serviceName);
  if (!service) {
    throw new DomainError("SERVICE_NOT_FOUND", `Serviço "${serviceName}" não encontrado.`);
  }

  const hours = await getWorkingHours(clientId, date);
  const existing = await getAppointmentsOnDate(clientId, date);
  const occupied = await getOccupiedWindows(existing);

  const slots: AvailableSlot[] = [];

  for (const wh of hours) {
    const open = timeToMinutes(wh.open_time);
    const close = timeToMinutes(wh.close_time);
    const lastStart = close - service.duration;

    for (let t = open; t <= lastStart; t += SLOT_STEP_MINUTES) {
      const conflict = occupied.some((w) => minutesOverlap(t, t + service.duration, w.start, w.end));
      if (!conflict) {
        slots.push({
          date,
          start_time: minutesToTime(t),
          end_time: minutesToTime(t + service.duration),
        });
      }
    }
  }

  return slots;
}

/**
 * Cria um agendamento validando conflito de horário dentro do tenant.
 * O banco garante UNIQUE(client_id, date, time); a sobreposição por
 * duração é verificada em memória antes da inserção.
 */
export async function createAppointment(params: {
  clientId: string;
  serviceName: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
}): Promise<Appointment> {
  if (!isValidDate(params.date)) {
    throw new DomainError("INVALID_DATE", "Data inválida. Use o formato YYYY-MM-DD.");
  }
  if (!isValidTime(params.time)) {
    throw new DomainError("INVALID_TIME", "Horário inválido. Use o formato HH:mm.");
  }

  const service = await findServiceByName(params.clientId, params.serviceName);
  if (!service) {
    throw new DomainError("SERVICE_NOT_FOUND", `Serviço "${params.serviceName}" não encontrado.`);
  }

  const start = timeToMinutes(params.time);
  const end = start + service.duration;

  const existing = await getAppointmentsOnDate(params.clientId, params.date);
  const occupied = await getOccupiedWindows(existing);

  const conflict = occupied.some((w) => minutesOverlap(start, end, w.start, w.end));
  if (conflict) {
    throw new DomainError("CONFLICT", "O horário solicitado não está mais disponível.");
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      client_id: params.clientId,
      service_id: service.id,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      date: params.date,
      time: params.time,
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
 * Cancela um agendamento do tenant localizado por serviço/data/horário.
 */
export async function cancelAppointment(params: {
  clientId: string;
  serviceName: string;
  date: string;
  time: string;
  customerPhone: string;
}): Promise<Appointment> {
  const service = await findServiceByName(params.clientId, params.serviceName);
  if (!service) {
    throw new DomainError("SERVICE_NOT_FOUND", `Serviço "${params.serviceName}" não encontrado.`);
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("client_id", params.clientId)
    .eq("service_id", service.id)
    .eq("date", params.date)
    .eq("time", params.time)
    .eq("customer_phone", params.customerPhone.replace(/\D/g, ""))
    .in("status", ["scheduled", "confirmed"])
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new DomainError("NOT_FOUND", "Agendamento não encontrado para cancelamento.");
  }

  return data as Appointment;
}