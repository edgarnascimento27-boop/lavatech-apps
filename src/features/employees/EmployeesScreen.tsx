import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";
import { EmptyState } from "@/ui/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrentEstablishment } from "@/features/establishment/useCurrentEstablishment";
import {
  useDeleteEmployee,
  useEmployees,
  useToggleEmployeeActive,
  type AppRole,
} from "@/data/queries/employees";
import type { Employee } from "@/domain/types";
import { EmployeeFormSheet } from "./EmployeeFormSheet";

function roleLabel(role: AppRole) {
  if (role === "owner") return "Proprietário";
  if (role === "manager") return "Gerente";
  return "Atendente";
}

function roleBadgeClass(role: AppRole) {
  if (role === "owner") return "bg-blue-100 text-blue-700";
  if (role === "manager") return "bg-purple-100 text-purple-700";
  return "bg-amber-100 text-amber-700";
}

export function EmployeesScreen() {
  const { establishmentId } = useCurrentEstablishment();
  const { data: employees, isLoading } = useEmployees(establishmentId);
  const toggleActive = useToggleEmployeeActive(establishmentId);
  const del = useDeleteEmployee(establishmentId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  const totalActive = useMemo(
    () => (employees ?? []).filter((employee) => employee.active).length,
    [employees],
  );

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setSheetOpen(true);
  }

  async function handleToggle(employee: Employee, next: boolean) {
    try {
      await toggleActive.mutateAsync({ id: employee.id, active: next });
    } catch (err) {
      toast.error("Não foi possível atualizar o status", {
        description: (err as Error).message,
      });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await del.mutateAsync(confirmDelete.id);
      toast.success("Funcionário removido");
      setConfirmDelete(null);
    } catch (err) {
      toast.error("Não foi possível excluir funcionário", {
        description: (err as Error).message,
      });
    }
  }

  return (
    <>
      <ScreenHeader
        title="Funcionários"
        subtitle={`Equipe do lava rápido • ${totalActive} ativo(s)`}
        actions={
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        }
      />

      <div className="px-4 pb-8">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Carregando funcionários…</p>
        ) : !employees || employees.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="Nenhum funcionário cadastrado"
            description="Cadastre sua equipe para organizar o atendimento."
            action={
              <Button onClick={openNew} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Cadastrar primeiro funcionário
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {employees.map((employee) => (
              <li key={employee.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`truncate text-base font-semibold ${
                          employee.active ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {employee.full_name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(
                          employee.role,
                        )}`}
                      >
                        {roleLabel(employee.role)}
                      </span>
                      {!employee.active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {employee.phone || "Telefone não informado"}
                    </p>
                  </div>

                  <Switch
                    checked={employee.active}
                    onCheckedChange={(v) => handleToggle(employee, v)}
                    aria-label="Funcionário ativo"
                  />
                </div>

                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => openEdit(employee)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(employee)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {establishmentId && (
        <EmployeeFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          establishmentId={establishmentId}
          editing={editing}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.full_name}" será removido permanentemente da equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
