// Sheet (bottom-sheet no mobile) para criar ou editar um tipo de lavagem.

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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WashType } from "@/domain/types";
import { useUpsertWashType } from "@/data/queries/washTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  editing?: WashType | null;
};

export function WashTypeFormSheet({ open, onOpenChange, establishmentId, editing }: Props) {
  const upsert = useUpsertWashType(establishmentId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [minutes, setMinutes] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setPrice(editing ? String(editing.price ?? "") : "");
    setMinutes(editing ? String(editing.estimated_minutes ?? "") : "30");
    setActive(editing?.active ?? true);
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = Number(price.replace(",", "."));
    const parsedMinutes = Number(minutes);
    if (!name.trim()) {
      toast.error("Informe o nome do serviço.");
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Preço inválido.");
      return;
    }
    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      toast.error("Tempo médio inválido.");
      return;
    }

    try {
      await upsert.mutateAsync({
        id: editing?.id,
        establishment_id: establishmentId,
        name: name.trim(),
        description: description.trim() || null,
        price: parsedPrice,
        estimated_minutes: parsedMinutes,
        active,
      });
      toast.success(editing ? "Serviço atualizado" : "Serviço criado");
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
            <SheetTitle>{editing ? "Editar serviço" : "Novo tipo de lavagem"}</SheetTitle>
            <SheetDescription>
              Defina nome, preço e tempo médio. Serviços inativos não aparecem na fila.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="wt-name">Nome</Label>
              <Input
                id="wt-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Lavagem simples"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wt-desc">Descrição (opcional)</Label>
              <Textarea
                id="wt-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que está incluso neste serviço"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wt-price">Preço (R$)</Label>
                <Input
                  id="wt-price"
                  inputMode="decimal"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wt-min">Tempo (min)</Label>
                <Input
                  id="wt-min"
                  inputMode="numeric"
                  required
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Serviço ativo</p>
                <p className="text-xs text-muted-foreground">Disponível para adicionar à fila</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
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
