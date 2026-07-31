import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, Clock3, Download, HandCoins, ListChecks, TrendingUp } from "lucide-react";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";
import { Button } from "@/components/ui/button";
import { useMyEstablishments } from "@/data/queries/establishment";
import { useReports, type ReportPeriod } from "@/data/queries/reports";

type PeriodOption = { label: string; value: ReportPeriod };

const PERIODS: PeriodOption[] = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 min";
  return `${Math.round(value)} min`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportsScreen() {
  const [period, setPeriod] = useState<ReportPeriod>("today");

  const { data: establishments } = useMyEstablishments();
  const establishmentId = establishments?.[0]?.id ?? null;

  const { data, isLoading, isError, error } = useReports(establishmentId, period);

  const maxMovement = useMemo(() => {
    const values = data?.dailyMovement.map((d) => d.atendimentos) ?? [];
    return values.length ? Math.max(...values, 1) : 1;
  }, [data?.dailyMovement]);

  const csvContent = useMemo(() => {
    if (!data) return "";
    const lines = [
      "secao,chave,valor",
      `kpi,atendimentos,${data.kpis.atendimentos}`,
      `kpi,faturamento,${data.kpis.faturamento.toFixed(2)}`,
      `kpi,ticket_medio,${data.kpis.ticketMedio.toFixed(2)}`,
      `kpi,tempo_medio_min,${data.kpis.tempoMedioMin.toFixed(2)}`,
      ...data.topServices.map(
        (item) =>
          `top_servico,${item.name.replaceAll(",", " ")},${item.count}|${item.revenue.toFixed(2)}`,
      ),
      ...data.dailyMovement.map(
        (item) =>
          `movimento_dia,${item.date},${item.atendimentos}|${item.faturamento.toFixed(2)}`,
      ),
    ];
    return lines.join("\n");
  }, [data]);

  return (
    <>
      <ScreenHeader
        title="Relatórios"
        subtitle="Indicadores reais do seu estabelecimento"
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!data}
            onClick={() => {
              if (!csvContent) return;
              downloadCsv(`relatorios-${period}.csv`, csvContent);
            }}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Exportar CSV
          </Button>
        }
      />

      <section className="px-4">
        <div className="mb-4 inline-flex rounded-xl border border-border bg-card p-1">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                period === item.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Carregando relatórios...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/40 bg-card p-4 text-sm text-destructive">
            Falha ao carregar relatórios: {(error as Error)?.message ?? "erro desconhecido"}
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Sem dados para este período.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Atendimentos", value: `${data.kpis.atendimentos}`, icon: ListChecks },
                {
                  label: "Faturamento",
                  value: formatCurrency(data.kpis.faturamento),
                  icon: HandCoins,
                },
                {
                  label: "Ticket médio",
                  value: formatCurrency(data.kpis.ticketMedio),
                  icon: TrendingUp,
                },
                {
                  label: "Tempo médio",
                  value: formatMinutes(data.kpis.tempoMedioMin),
                  icon: Clock3,
                },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <article
                    key={kpi.label}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</p>
                  </article>
                );
              })}
            </div>

            <section className="mt-6 space-y-3 pb-6">
              <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <header className="mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">
                    Serviços mais realizados
                  </h2>
                </header>

                {!data.topServices.length ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum serviço finalizado no período selecionado.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.topServices.map((service) => (
                      <li
                        key={service.washTypeId}
                        className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
                      >
                        <span className="text-sm text-foreground">{service.name}</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {service.count} atend. · {formatCurrency(service.revenue)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <header className="mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <h2 className="text-sm font-semibold tracking-wide text-foreground">
                    Movimento por dia
                  </h2>
                </header>

                {!data.dailyMovement.length ? (
                  <p className="text-sm text-muted-foreground">
                    Sem movimento para o período selecionado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.dailyMovement.map((item) => {
                      const pct = Math.max(6, Math.round((item.atendimentos / maxMovement) * 100));
                      return (
                        <div
                          key={item.date}
                          className="grid grid-cols-[40px_1fr_92px] items-center gap-2"
                        >
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <div className="h-2 rounded-full bg-secondary">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-right text-xs font-medium text-foreground">
                            {item.atendimentos} · {formatCurrency(item.faturamento)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </section>
    </>
  );
}
