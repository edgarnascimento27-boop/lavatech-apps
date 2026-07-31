// Bottom navigation fixa — navegação primária mobile do painel.

import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListOrdered, CalendarClock, Users, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const TABS: readonly Tab[] = [
  { to: "/", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/fila", label: "Fila", icon: ListOrdered },
  { to: "/agendamentos", label: "Agenda", icon: CalendarClock },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/mais", label: "Mais", icon: MoreHorizontal },
];

export function BottomTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-safe">
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.to
            : pathname === tab.to || pathname.startsWith(tab.to + "/");
          const Icon = tab.icon;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} aria-hidden />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
