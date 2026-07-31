// Sheet para associar/editar um veículo vinculado a um cliente existente.

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Vehicle } from "@/domain/types";
import { useUpsertVehicle } from "@/data/queries/customers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentId: string;
  customerId: string;
  customerName: string;
  editing?: Vehicle | null;
};

const VEHICLE_TYPES = [
  { value: "carro", label: "Carro" },
  { value: "moto", label: "Moto" },
  { value: "caminhonete", label: "Caminhonete" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van/Utilitário" },
  { value: "outro", label: "Outro" },
];

// Placa Mercosul (AAA0A00) ou antiga (AAA0000).
const PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

export function VehicleFormSheet({
  open,
  onOpenChange,
  establishmentId,
  customerId,
  customerName,
  editing,
}: Props) {
  const upsert = useUpsertVehicle(establishmentId);
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [type, setType] = useState<string>("carro");

  useEffect(() => {
    if (!open) return;
    setPlate(editing?.license_plate ?? "");
    setModel(editing?.model ?? "");
    setColor(editing?.color ?? "");
    setType(editing?.vehicle_type ?? "carro");
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedPlate = plate.replace(/[\s-]+/g, "").toUpperCase();
    if (!PLATE_REGEX.test(normalizedPlate)) {
      toast.error("Placa inválida", {
        description: "Use o formato AAA-0000 ou Mercosul (AAA0A00).",
      });
      return;
    }
    if (!model.trim()) {
      toast.error("Informe o modelo do veículo.");
      return;
    }
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        establishment_id: establishmentId,
        customer_id: customerId,
        license_plate: normalizedPlate,
        model: model.trim(),
        color: color.trim() || null,
        vehicle_type: type,
      });
      toast.success(editing ? "Veículo atualizado" : "Veículo vinculado");
      onOpenChange(false);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
        toast.error("Placa já cadastrada neste estabelecimento.");
      } else {
        toast.error("Não foi possível salvar", { description: msg });
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] rounded-t-2xl p-0 sm:h-auto sm:max-w-md sm:rounded-2xl"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>{editing ? "Editar veículo" : "Vincular veículo"}</SheetTitle>
            <SheetDescription>
              Cliente: <span className="font-medium">{customerName}</span>
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="v-plate">Placa</Label>
              <Input
                id="v-plate"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="ABC1D23"
                maxLength={8}
                autoCapitalize="characters"
                className="uppercase tracking-wider"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-type">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="v-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-model">Modelo</Label>
              <Input
                id="v-model"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex.: Honda Civic 2020"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-color">Cor (opcional)</Label>
              <Input
                id="v-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex.: Prata"
                maxLength={30}
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
