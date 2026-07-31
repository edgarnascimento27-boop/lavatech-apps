import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { QueueEntry, QueueStatusHistory } from "@/domain/types";
import type { Enums } from "@/integrations/supabase/types";

type QueueStatus = Enums<"queue_status">;
type AppointmentStatus = Enums<"appointment_status">;

export type QueueEntryWithRelations = QueueEntry & {
  customer: { id: string; full_name: string | null; phone: string | null } | null;
  vehicle: { id: string; license_plate: string; model: string | null; color: string | null } | null;
  wash_type: { id: string; name: string; estimated_minutes: number; price: number } | null;
};

export type QueueHistoryWithEntry = QueueStatusHistory & {
  queue_entry: {
    id: string;
    customer: { full_name: string | null } | null;
    vehicle: { license_plate: string; model: string | null } | null;
  } | null;
};

export const queueEntriesQueryKey = (establishmentId: string) =>
  ["queue-entries", establishmentId] as const;

export const queueHistoryQueryKey = (establishmentId: string) =>
  ["queue-history", establishmentId] as const;

export const queueEntriesQuery = (establishmentId: string) =>
  queryOptions({
    queryKey: queueEntriesQueryKey(establishmentId),
    queryFn: async (): Promise<QueueEntryWithRelations[]> => {
      const { data, error } = await supabase
        .from("queue_entries")
        .select(
          `
          *,
          customer:customers(id, full_name, phone),
          vehicle:vehicles(id, license_plate, model, color),
          wash_type:wash_types(id, name, estimated_minutes, price)
        `,
        )
        .eq("establishment_id", establishmentId)
        .neq("status", "concluido")
        .neq("status", "cancelado")
        .order("position", { ascending: true, nullsFirst: false })
        .order("arrived_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as QueueEntryWithRelations[];
    },
    enabled: !!establishmentId,
  });

export const queueHistoryQuery = (establishmentId: string) =>
  queryOptions({
    queryKey: queueHistoryQueryKey(establishmentId),
    queryFn: async (): Promise<QueueHistoryWithEntry[]> => {
      const { data, error } = await supabase
        .from("queue_status_history")
        .select(
          `
          *,
          queue_entry:queue_entries(
            id,
            customer:customers(full_name),
            vehicle:vehicles(license_plate, model)
          )
        `,
        )
        .eq("establishment_id", establishmentId)
        .order("changed_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data ?? []) as QueueHistoryWithEntry[];
    },
    enabled: !!establishmentId,
  });

export function useQueueEntries(establishmentId: string | null) {
  return useQuery({
    ...queueEntriesQuery(establishmentId ?? ""),
    enabled: !!establishmentId,
  });
}

export function useQueueHistory(establishmentId: string | null) {
  return useQuery({
    ...queueHistoryQuery(establishmentId ?? ""),
    enabled: !!establishmentId,
  });
}

async function addQueueHistory(params: {
  establishmentId: string;
  queueEntryId: string;
  fromStatus: QueueStatus | null;
  toStatus: QueueStatus;
  userId: string | null;
}) {
  const { error } = await supabase.from("queue_status_history").insert({
    establishment_id: params.establishmentId,
    queue_entry_id: params.queueEntryId,
    from_status: params.fromStatus,
    to_status: params.toStatus,
    changed_by: params.userId,
  });
  if (error) throw error;
}

function nextStatusFromAction(action: "start" | "pause" | "finish"): QueueStatus {
  if (action === "start") return "lavando";
  if (action === "pause") return "em_preparacao";
  return "concluido";
}

export function useUpdateQueueStatus(establishmentId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      queueEntryId: string;
      currentStatus: QueueStatus;
      action: "start" | "pause" | "finish";
    }) => {
      if (!establishmentId) throw new Error("Estabelecimento não identificado.");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const toStatus = nextStatusFromAction(params.action);
      const patch: Partial<QueueEntry> = {
        status: toStatus,
        updated_at: new Date().toISOString(),
      };

      if (params.action === "start") patch.started_at = new Date().toISOString();
      if (params.action === "finish") patch.finished_at = new Date().toISOString();

      const { error } = await supabase
        .from("queue_entries")
        .update(patch)
        .eq("id", params.queueEntryId)
        .eq("establishment_id", establishmentId);

      if (error) throw error;

      await addQueueHistory({
        establishmentId,
        queueEntryId: params.queueEntryId,
        fromStatus: params.currentStatus,
        toStatus,
        userId: authData.user?.id ?? null,
      });

      return { toStatus };
    },
    onSuccess: () => {
      if (!establishmentId) return;
      qc.invalidateQueries({ queryKey: queueEntriesQueryKey(establishmentId) });
      qc.invalidateQueries({ queryKey: queueHistoryQueryKey(establishmentId) });
    },
  });
}

export function subscribeQueueRealtime(
  establishmentId: string,
  onQueueChange: () => void,
  onAppointmentEvent?: (status: AppointmentStatus) => void,
) {
  const channel = supabase
    .channel(`queue-realtime-${establishmentId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "queue_entries",
        filter: `establishment_id=eq.${establishmentId}`,
      },
      () => onQueueChange(),
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "appointments",
        filter: `establishment_id=eq.${establishmentId}`,
      },
      (payload) => {
        const status = (payload.new as { status?: AppointmentStatus } | null)?.status;
        if (status && onAppointmentEvent) onAppointmentEvent(status);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
