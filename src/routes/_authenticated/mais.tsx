import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Droplets,
  UserCog,
  History,
  BarChart3,
  Settings,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";

export const Route = createFileRoute("/_authenticated/mais")({
  component: MoreScreen,
});

const ITEMS = [
  { to: "/servicos", label: "Tipos de lavagem", icon: Droplets },
  { to: "/funcionarios", label: "Funcionários", icon: UserCog },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/perfil", label: "Meu perfil", icon: User },
] as const;

function MoreScreen() {
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <>
      <ScreenHeader title="Mais" subtitle="Módulos e configurações" />
      <div className="px-4">
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          onClick={handleSignOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sair
        </button>
      </div>
    </>
  );
}
