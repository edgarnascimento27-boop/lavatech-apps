// Layout mobile do painel: topbar compacta + conteúdo + bottom tabs.
// Toda tela autenticada renderiza dentro do <Outlet /> daqui.

import { Outlet } from "@tanstack/react-router";
import { Bell, Droplets } from "lucide-react";
import { BottomTabs } from "./BottomTabs";
import { useMyEstablishments } from "@/data/queries/establishment";

export function AppShell() {
  const { data: establishments } = useMyEstablishments();
  const current = establishments?.[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur pt-safe">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Droplets className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              LavaTech · Parceiro
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {current?.name ?? "Meu estabelecimento"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Notificações"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl">
        <Outlet />
      </main>

      <BottomTabs />
    </div>
  );
}
