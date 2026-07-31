import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { ModulePlaceholder } from "@/ui/layout/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/agendamentos")({
  component: () => (
    <ModulePlaceholder
      title="Agendamentos"
      subtitle="Reservas dos seus clientes"
      icon={<CalendarClock className="h-5 w-5" />}
    />
  ),
});
