import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { ModulePlaceholder } from "@/ui/layout/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: () => (
    <ModulePlaceholder
      title="Meu perfil"
      subtitle="Dados pessoais e sessão"
      icon={<User className="h-5 w-5" />}
    />
  ),
});
