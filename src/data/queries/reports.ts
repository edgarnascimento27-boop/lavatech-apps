import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReportPeriod = "today" | "7d" | "30d";

export type ReportKpis = {
  atendimentos: number;
  faturamento: number;
  ticketMedio: number;
  tempoMedioMin: number;
};

export type TopServiceItem = {
  washTypeId: string;
  name: string;
  count: number;
  revenue: number;
};

export type DailyMovementItem = {
  date: string;
  label: string;
  atendimentos: number;
  faturamento: number;
};

export type ReportsData = {
  kpis: ReportKpis;
  topServices: TopServiceItem[];
  dailyMovement: DailyMovementItem[];
};

function formatDayLabel(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
  });
}

function startDateByPeriod(period: ReportPeriod): string {
  const now = new Date();
  const start = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }
  return start.toISOString();
}

type QueueEntryReportRow = {
  id: string;
  finished_at: string | null;
  started_at: string | null;
  wash_type_id: string | null;
  wash_type: { id: string; name: string; price: number | null } | null;
};

export const reportsQueryKey = (establishmentId: string, period: ReportPeriod) =>
  ["reports", establishmentId, period] as const;

export const reportsQuery = (establishmentId: string, period: ReportPeriod) =>
  queryOptions({
    queryKey: reportsQueryKey(establishmentId, period),
    queryFn: async (): Promise<ReportsData> => {
      const startIso = startDateByPeriod(period);

      const { data, error } = await supabase
        .from("queue_entries")
        .select(
          `
          id,
          finished_at,
          started_at,
          wash_type_id,
          wash_type:wash_types(id, name, price)
        `,
        )
        .eq("establishment_id", establishmentId)
        .eq("status", "concluido")
        .gte("finished_at", startIso)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as QueueEntryReportRow[];

      let atendimentos = 0;
      let faturamento = 0;
      let tempoTotalMin = 0;
      let tempoCount = 0;

      const byService = new Map<string, TopServiceItem>();
      const byDay = new Map<string, DailyMovementItem>();

      for (const row of rows) {
        atendimentos += 1;

        const price = Number(row.wash_type?.price ?? 0);
        faturamento += price;

        if (row.started_at && row.finished_at) {
          const startMs = new Date(row.started_at).getTime();
          const finishMs = new Date(row.finished_at).getTime();
          if (!Number.isNaN(startMs) && !Number.isNaN(finishMs) && finishMs >= startMs) {
            tempoTotalMin += Math.round((finishMs - startMs) / 60000);
            tempoCount += 1;
          }
        }

        if (row.wash_type_id) {
          const current = byService.get(row.wash_type_id);
          if (current) {
            current.count += 1;
            current.revenue += price;
          } else {
            byService.set(row.wash_type_id, {
              washTypeId: row.wash_type_id,
              name: row.wash_type?.name ?? "Serviço",
              count: 1,
              revenue: price,
            });
          }
        }

        if (row.finished_at) {
          const date = row.finished_at.slice(0, 10);
          const currentDay = byDay.get(date);
          if (currentDay) {
            currentDay.atendimentos += 1;
            currentDay.faturamento += price;
          } else {
            byDay.set(date, {
              date,
              label: formatDayLabel(date),
              atendimentos: 1,
              faturamento: price,
            });
          }
        }
      }

      const ticketMedio = atendimentos > 0 ? faturamento / atendimentos : 0;
      const tempoMedioMin = tempoCount > 0 ? tempoTotalMin / tempoCount : 0;

      const topServices = [...byService.values()].sort((a, b) => b.count - a.count).slice(0, 8);

      const dailyMovement = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));

      return {
        kpis: {
          atendimentos,
          faturamento,
          ticketMedio,
          tempoMedioMin,
        },
        topServices,
        dailyMovement,
      };
    },
    enabled: !!establishmentId,
  });

export function useReports(establishmentId: string | null, period: ReportPeriod) {
  return useQuery({
    ...reportsQuery(establishmentId ?? "", period),
    enabled: !!establishmentId,
  });
}
