// Tipos de domínio derivados do schema do banco.
// Camada pura — não depende de React nem de Supabase.

import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Establishment = Tables<"establishments">;
export type EstablishmentSettings = Tables<"establishment_settings">;
export type Employee = Tables<"employees">;
export type WashType = Tables<"wash_types">;
export type Customer = Tables<"customers">;
export type Vehicle = Tables<"vehicles">;
export type QueueEntry = Tables<"queue_entries">;
export type QueueStatusHistory = Tables<"queue_status_history">;
export type Appointment = Tables<"appointments">;
export type Payment = Tables<"payments">;
export type UserRole = Tables<"user_roles">;
