import { createFileRoute } from "@tanstack/react-router";
import { EmployeesScreen } from "@/features/employees/EmployeesScreen";

export const Route = createFileRoute("/_authenticated/funcionarios")({
  component: EmployeesScreen,
});
