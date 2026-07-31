import { createFileRoute } from "@tanstack/react-router";
import { CustomersScreen } from "@/features/customers/CustomersScreen";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: CustomersScreen,
});
