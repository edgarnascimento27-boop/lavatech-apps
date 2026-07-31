// Dashboard: KPIs do dia (implementação real vem em etapa dedicada).

import { LayoutDashboard, ListOrdered, CalendarClock, Users, Wallet } from "lucide-react";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";

const KPIS = [
  { label: "Na fila agora", value: "—", icon: ListOrdered },
  { label: "Agendamentos hoje", value: "—", icon: CalendarClock },
  { label: "Clientes atendidos", value: "—", icon: Users },
  { label: "Faturamento do dia", value: "—", icon: Wallet },
] as const;

export function DashboardScreen() {
  return (
    <>
      <ScreenHeader title="Bom dia 👋" subtitle="Resumo do seu lava rápido hoje" />
      <section className="grid grid-cols-2 gap-3 px-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{k.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-6 px-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Atalhos
        </h2>
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          <LayoutDashboard className="mx-auto mb-2 h-6 w-6 opacity-60" aria-hidden />
          KPIs em tempo real serão ativados junto com o módulo Fila.
        </div>
      </section>
    </>
  );
}
