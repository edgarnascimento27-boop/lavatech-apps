// Sheet para criar/editar um cliente do estabelecimento.

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Customer } from "@/domain/types";
import { useUpsertCustomer } from "@/data/queries/customers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  editing?: Customer | null;
};

export function CustomerFormSheet({ open, onOpenChange, establishmentId, editing }: Props) {
  const upsert = useUpsertCustomer(establishmentId);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setFullName(editing?.full_name ?? "");
    setPhone(editing?.phone ?? "");
    setEmail(editing?.email ?? "");
    setNotes(editing?.notes ?? "");
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = fullName.trim();
    if (name.length < 2) {
      toast.error("Informe o nome completo (mínimo 2 caracteres).");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phone && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
      toast.error("Telefone inválido. Use DDD + número.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("E-mail inválido.");
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        establishment_id: establishmentId,
        full_name: name,
        phone: phoneDigits || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success(editing ? "Cliente atualizado" : "Cliente cadastrado");
      onOpenChange(false);
    } catch (err) {
      toast.error("Não foi possível salvar", {
        description: (err as Error).message,
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-2xl p-0 sm:h-auto sm:max-w-md sm:rounded-2xl"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>{editing ? "Editar cliente" : "Novo cliente"}</SheetTitle>
            <SheetDescription>
              Cadastre os dados básicos. Depois é possível adicionar veículos.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Nome completo</Label>
              <Input
                id="c-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex.: João da Silva"
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Telefone (WhatsApp)</Label>
              <Input
                id="c-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">E-mail (opcional)</Label>
              <Input
                id="c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-notes">Observações</Label>
              <Textarea
                id="c-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferências, restrições, etc."
                maxLength={500}
              />
            </div>
          </div>

          <SheetFooter className="border-t px-5 py-4">
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={upsert.isPending}>
                {upsert.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
