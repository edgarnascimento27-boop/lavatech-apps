import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/features/auth/AuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — LavaTech Parceiro" },
      { name: "description", content: "Acesse o painel do parceiro LavaTech." },
    ],
  }),
  component: AuthScreen,
});
