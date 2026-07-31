import { History, CarFront } from "lucide-react";
import { EmptyState } from "@/ui/layout/EmptyState";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMyEstablishments } from "@/data/queries/establishment";
import { useQueueHistory } from "@/data/queries/queue";
import type { Enums } from "@/integrations/supabase/types";

type QueueStatus = Enums<"queue_status">;

function statusLabel(status: QueueStatus | null): string {
  if (!status) return "-";
  if (status === "aguardando") return "Aguardando";
  if (status === "em_preparacao") return "Em preparação";
  if (status === "lavando") return "Lavando";
  if (status === "finalizando") return "Finalizando";
  if (status === "pronto") return "Pronto";
  if (status === "concluido") return "Concluído";
  if (status === "cancelado") return "Cancelado";
  return status;
}

export function HistoryScreen() {
  const { data: establishments } = useMyEstablishments();
  const establishmentId = establishments?.[0]?.id ?? null;
  const { data: history, isLoading } = useQueueHistory(establishmentId);

  return (
    <section className="space-y-4 p-4">
      <ScreenHeader title="Histórico" subtitle="Registro das mudanças de status dos atendimentos" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      ) : !history?.length ? (
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title="Sem registros ainda"
          description="As mudanças de status da fila aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {item.queue_entry?.customer?.full_name ?? "Cliente não informado"}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <CarFront className="h-4 w-4" />
                  {item.queue_entry?.vehicle?.model ?? "Veículo"} ·{" "}
                  {item.queue_entry?.vehicle?.license_plate ?? "Sem placa"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">De:</span> {statusLabel(item.from_status)}
                </p>
                <p>
                  <span className="text-muted-foreground">Para:</span> {statusLabel(item.to_status)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.changed_at).toLocaleString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
