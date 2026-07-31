import { createFileRoute } from "@tanstack/react-router";
import { QueueScreen } from "@/features/queue/QueueScreen";

export const Route = createFileRoute("/_authenticated/fila")({
  component: QueueScreen,
});
