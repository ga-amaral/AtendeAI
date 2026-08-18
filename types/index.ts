export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Client {
  id: string;
  user_id: string;
  business_name: string;
  business_phone: string | null;
  segment: string | null;
  evolution_instance_name: string | null;
  evolution_api_key: string | null;
  openai_api_key: string | null;
  openai_model: string | null;
  active: boolean;
  created_at: string;
}

export interface AttendancePrompt {
  id: string;
  client_id: string;
  system_prompt: string;
  business_rules: unknown | null;
  services: unknown | null;
  working_hours: unknown | null;
  greeting_message: string | null;
  fallback_message: string | null;
  active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  duration: number; // minutos
  price: number | null;
  active: boolean;
  created_at: string;
}

export interface WorkingHours {
  id: string;
  client_id: string;
  day_of_week: number; // 0 (Domingo) a 6 (Sábado)
  open_time: string; // "HH:mm" local do negócio
  close_time: string; // "HH:mm" local do negócio
  is_closed: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  customer_phone: string;
  evolution_instance_name: string | null;
  messages: unknown[];
  last_message_at: string;
  created_at: string;
}

export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  start_time: string; // "HH:mm"
  end_time: string; // "HH:mm"
}