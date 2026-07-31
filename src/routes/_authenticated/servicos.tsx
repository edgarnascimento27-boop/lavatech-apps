import { createFileRoute } from "@tanstack/react-router";
import { WashTypesScreen } from "@/features/wash-types/WashTypesScreen";

export const Route = createFileRoute("/_authenticated/servicos")({
  component: WashTypesScreen,
});
