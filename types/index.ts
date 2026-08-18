export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed";

export type ConversationStatus =
  | "open"
  | "resolved"
  | "archived";

export interface Client {
  id: string;
  owner_user_id: string;
  name: string;
  timezone: string;
  evolution_instance: string | null;
  created_at: string;
}

export interface AttendancePrompt {
  id: string;
  client_id: string;
  name: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  client_id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
}

export interface WorkingHours {
  id: string;
  client_id: string;
  day_of_week: number; // 0 (Domingo) a 6 (Sábado)
  start_time: string; // "HH:mm" local do tenant
  end_time: string; // "HH:mm" local do tenant
  is_available: boolean;
}

export interface Appointment {
  id: string;
  client_id: string;
  service_id: string | null;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  reminder_sent_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  contact_name: string | null;
  contact_phone: string;
  status: ConversationStatus;
  last_message_at: string;
  messages: unknown[];
  created_at: string;
  updated_at: string;
}

export interface AvailableSlot {
  start: string; // ISO
  end: string; // ISO
  start_time: string; // "HH:mm"
  end_time: string; // "HH:mm"
}