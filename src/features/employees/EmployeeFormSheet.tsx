import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Employee } from "@/domain/types";
import { useUpsertEmployee, type AppRole } from "@/data/queries/employees";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  editing: Employee | null;
};

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "owner", label: "Proprietário" },
  { value: "manager", label: "Gerente" },
  { value: "attendant", label: "Atendente" },
];

export function EmployeeFormSheet({ open, onOpenChange, establishmentId, editing }: Props) {
  const upsert = useUpsertEmployee(establishmentId);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("attendant");

  const isEditing = useMemo(() => !!editing, [editing]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setFullName(editing.full_name ?? "");
      setPhone(editing.phone ?? "");
      setRole(editing.role);
      return;
    }
    setFullName("");
    setPhone("");
    setRole("attendant");
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Informe o nome do funcionário");
      return;
    }

    try {
      await upsert.mutateAsync({
        id: editing?.id,
        establishment_id: establishmentId,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role,
        active: editing?.active ?? true,
        user_id: editing?.user_id ?? null,
      });

      toast.success(isEditing ? "Funcionário atualizado" : "Funcionário cadastrado");
      onOpenChange(false);
    } catch (err) {
      toast.error("Não foi possível salvar funcionário", {
        description: (err as Error).message,
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar funcionário" : "Novo funcionário"}</SheetTitle>
          <SheetDescription>
            Preencha os dados da equipe que participa do atendimento.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="employee-name">Nome completo</Label>
            <Input
              id="employee-name"
              placeholder="Ex.: João da Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employee-phone">Telefone (opcional)</Label>
            <Input
              id="employee-phone"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employee-role">Cargo</Label>
            <select
              id="employee-role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
            >
              {ROLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-1.5" disabled={upsert.isPending}>
              {upsert.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
