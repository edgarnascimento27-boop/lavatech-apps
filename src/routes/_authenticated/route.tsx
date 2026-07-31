// Layout autenticado gerenciado (padrão da integração Supabase).
// Redireciona para /auth quando não há sessão.
// Também garante que o usuário tenha um estabelecimento antes de entrar no painel.

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/ui/layout/AppShell";
import { useMyEstablishments } from "@/data/queries/establishment";
import { CreateEstablishmentScreen } from "@/features/auth/CreateEstablishmentScreen";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const { data: establishments, isLoading } = useMyEstablishments();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!establishments || establishments.length === 0) {
    return <CreateEstablishmentScreen userId={user.id} />;
  }

  return <AppShell />;
}

// Re-export para que <Outlet /> exista caso importem daqui.
export { Outlet };
