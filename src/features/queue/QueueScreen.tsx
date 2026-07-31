import { useEffect } from "react";
import { CirclePause, Play, CheckCircle2, Clock3, CarFront } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/ui/layout/EmptyState";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";
import { useMyEstablishments } from "@/data/queries/establishment";
import {
  subscribeQueueRealtime,
  useQueueEntries,
  useUpdateQueueStatus,
} from "@/data/queries/queue";
import { useQueryClient } from "@tanstack/react-query";
import type { Enums } from "@/integrations/supabase/types";

type QueueStatus = Enums<"queue_status">;
type AppointmentStatus = Enums<"appointment_status">;

function statusLabel(status: QueueStatus): string {
  if (status === "aguardando") return "Aguardando";
  if (status === "em_preparacao") return "Em preparação";
  if (status === "lavando") return "Em andamento";
  if (status === "finalizando") return "Finalizando";
  if (status === "pronto") return "Finalizado";
  if (status === "concluido") return "Concluído";
  if (status === "cancelado") return "Cancelado";
  return status;
}

function statusBadgeClass(status: QueueStatus): string {
  if (status === "aguardando") return "bg-amber-100 text-amber-800";
  if (status === "em_preparacao" || status === "lavando" || status === "finalizando")
    return "bg-blue-100 text-blue-800";
  return "bg-emerald-100 text-emerald-800";
}

function shouldNotifyAppointment(status: AppointmentStatus) {
  return status === "confirmado" || status === "cancelado";
}

function notifyAppointment(status: AppointmentStatus) {
  if (status === "confirmado") {
    toast.success("Agendamento aceito", {
      description: "Um agendamento foi confirmado.",
    });
    return;
  }
  if (status === "cancelado") {
    toast.warning("Agendamento cancelado", {
      description: "Um agendamento foi cancelado.",
    });
  }
}

export function QueueScreen() {
  const qc = useQueryClient();
  const { data: establishments } = useMyEstablishments();
  const establishmentId = establishments?.[0]?.id ?? null;

  const { data: entries, isLoading } = useQueueEntries(establishmentId);
  const updateStatus = useUpdateQueueStatus(establishmentId);

  useEffect(() => {
    if (!establishmentId) return;
    const unsubscribe = subscribeQueueRealtime(
      establishmentId,
      () => {
        qc.invalidateQueries({ queryKey: ["queue-entries", establishmentId] });
        qc.invalidateQueries({ queryKey: ["queue-history", establishmentId] });
      },
      (status) => {
        if (shouldNotifyAppointment(status)) notifyAppointment(status);
      },
    );
    return unsubscribe;
  }, [establishmentId, qc]);

  async function handleAction(
    queueEntryId: string,
    currentStatus: QueueStatus,
    action: "start" | "pause" | "finish",
  ) {
    try {
      await updateStatus.mutateAsync({ queueEntryId, currentStatus, action });
      if (action === "finish") {
        toast.success("Lavagem concluída", {
          description: "O item foi movido para o histórico.",
        });
      }
    } catch (error) {
      toast.error("Não foi possível atualizar o status", {
        description: error instanceof Error ? error.message : "Erro inesperado.",
      });
    }
  }

  return (
    <section className="space-y-4 p-4">
      <ScreenHeader
        title="Fila de atendimento"
        subtitle="Atualização em tempo real e controle operacional"
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando fila...</p>
      ) : !entries?.length ? (
        <EmptyState
          icon={<CarFront className="h-5 w-5" />}
          title="Sem veículos na fila"
          description="Quando novos atendimentos forem criados, eles aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isInProgress =
              entry.status === "em_preparacao" ||
              entry.status === "lavando" ||
              entry.status === "finalizando";
            const canStart = entry.status === "aguardando" || entry.status === "em_preparacao";
            const canPause = entry.status === "lavando";
            const canFinish = isInProgress || entry.status === "pronto";

            return (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {entry.customer?.full_name ?? "Cliente não informado"}
                      </CardTitle>
                      <CardDescription>
                        {entry.vehicle?.model ?? "Veículo"} ·{" "}
                        {entry.vehicle?.license_plate ?? "Sem placa"}
                      </CardDescription>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(entry.status)}`}
                    >
                      {statusLabel(entry.status)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Posição: {entry.position ?? "-"}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {entry.estimated_minutes ?? entry.wash_type?.estimated_minutes ?? "-"} min
                    </span>
                    <span>Serviço: {entry.wash_type?.name ?? "Não informado"}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      disabled={!canStart || updateStatus.isPending}
                      onClick={() => handleAction(entry.id, entry.status, "start")}
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Iniciar
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canPause || updateStatus.isPending}
                      onClick={() => handleAction(entry.id, entry.status, "pause")}
                    >
                      <CirclePause className="mr-1 h-4 w-4" />
                      Pausar
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={!canFinish || updateStatus.isPending}
                      onClick={() => handleAction(entry.id, entry.status, "finish")}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Concluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
