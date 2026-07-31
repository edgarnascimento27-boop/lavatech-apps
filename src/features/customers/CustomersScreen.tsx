// Tela principal: listagem, busca e CRUD de clientes e veículos vinculados.

import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Car,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";
import { EmptyState } from "@/ui/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { useCurrentEstablishment } from "@/features/establishment/useCurrentEstablishment";
import {
  useCustomers,
  useDeleteCustomer,
  useDeleteVehicle,
  filterCustomers,
  type CustomerWithVehicles,
} from "@/data/queries/customers";
import type { Customer, Vehicle } from "@/domain/types";
import { formatPhone, formatPlate } from "@/lib/format";
import { CustomerFormSheet } from "./CustomerFormSheet";
import { VehicleFormSheet } from "./VehicleFormSheet";

type VehicleEditTarget = {
  customer: CustomerWithVehicles;
  vehicle: Vehicle | null;
};

export function CustomersScreen() {
  const { establishmentId } = useCurrentEstablishment();
  const { data, isLoading } = useCustomers(establishmentId);
  const delCustomer = useDeleteCustomer(establishmentId);
  const delVehicle = useDeleteVehicle(establishmentId);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [customerSheet, setCustomerSheet] = useState<{
    open: boolean;
    editing: Customer | null;
  }>({ open: false, editing: null });
  const [vehicleSheet, setVehicleSheet] = useState<{
    open: boolean;
    target: VehicleEditTarget | null;
  }>({ open: false, target: null });
  const [confirmDelCustomer, setConfirmDelCustomer] = useState<CustomerWithVehicles | null>(null);
  const [confirmDelVehicle, setConfirmDelVehicle] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => filterCustomers(data, query), [data, query]);

  function toggle(id: string) {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  }

  async function handleDeleteCustomer() {
    if (!confirmDelCustomer) return;
    try {
      await delCustomer.mutateAsync(confirmDelCustomer.id);
      toast.success("Cliente removido");
      setConfirmDelCustomer(null);
    } catch (err) {
      toast.error("Não foi possível remover", {
        description: (err as Error).message,
      });
    }
  }

  async function handleDeleteVehicle() {
    if (!confirmDelVehicle) return;
    try {
      await delVehicle.mutateAsync(confirmDelVehicle.id);
      toast.success("Veículo removido");
      setConfirmDelVehicle(null);
    } catch (err) {
      toast.error("Não foi possível remover", {
        description: (err as Error).message,
      });
    }
  }

  return (
    <>
      <ScreenHeader
        title="Clientes"
        subtitle="Cadastro, veículos e histórico"
        actions={
          <Button
            size="sm"
            onClick={() => setCustomerSheet({ open: true, editing: null })}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        }
      />

      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, telefone ou placa"
            className="pl-9"
          />
        </div>
      </div>

      <div className="px-4 pb-8 pt-3">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="Nenhum cliente cadastrado"
            description="Cadastre seu primeiro cliente para começar a montar o histórico do lava rápido."
            action={
              <Button
                onClick={() => setCustomerSheet({ open: true, editing: null })}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Cadastrar cliente
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Nada encontrado"
            description={`Nenhum cliente para "${query}". Tente outro nome, telefone ou placa.`}
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((c) => {
              const isOpen = expanded[c.id] ?? false;
              return (
                <li key={c.id} className="rounded-2xl border border-border bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {c.full_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {c.full_name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatPhone(c.phone)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {c.vehicles.length} {c.vehicles.length === 1 ? "veículo" : "veículos"}
                        </span>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t px-4 py-3">
                      {c.notes && (
                        <p className="mb-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                          {c.notes}
                        </p>
                      )}

                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Veículos
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() =>
                            setVehicleSheet({
                              open: true,
                              target: { customer: c, vehicle: null },
                            })
                          }
                        >
                          <Plus className="h-3 w-3" />
                          Vincular
                        </Button>
                      </div>

                      {c.vehicles.length === 0 ? (
                        <p className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">
                          Nenhum veículo vinculado
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {c.vehicles.map((v) => (
                            <li
                              key={v.id}
                              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
                            >
                              <Car className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {v.model || "Veículo sem modelo"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {formatPlate(v.license_plate)}
                                  {v.color ? ` · ${v.color}` : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setVehicleSheet({
                                    open: true,
                                    target: { customer: c, vehicle: v },
                                  })
                                }
                                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                                aria-label="Editar veículo"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelVehicle(v)}
                                className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                                aria-label="Excluir veículo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 flex gap-2 border-t pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => setCustomerSheet({ open: true, editing: c })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => setConfirmDelCustomer(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {establishmentId && (
        <CustomerFormSheet
          open={customerSheet.open}
          onOpenChange={(o) =>
            setCustomerSheet((s) => ({ ...s, open: o, editing: o ? s.editing : null }))
          }
          establishmentId={establishmentId}
          editing={customerSheet.editing}
        />
      )}

      {establishmentId && vehicleSheet.target && (
        <VehicleFormSheet
          open={vehicleSheet.open}
          onOpenChange={(o) =>
            setVehicleSheet((s) => ({
              open: o,
              target: o ? s.target : null,
            }))
          }
          establishmentId={establishmentId}
          customerId={vehicleSheet.target.customer.id}
          customerName={vehicleSheet.target.customer.full_name}
          editing={vehicleSheet.target.vehicle}
        />
      )}

      <AlertDialog
        open={!!confirmDelCustomer}
        onOpenChange={(o) => !o && setConfirmDelCustomer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelCustomer?.full_name}" e todos os veículos vinculados serão removidos.
              Atendimentos no histórico são mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmDelVehicle}
        onOpenChange={(o) => !o && setConfirmDelVehicle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              O veículo{" "}
              <span className="font-medium">
                {confirmDelVehicle?.license_plate && formatPlate(confirmDelVehicle.license_plate)}
              </span>{" "}
              será desvinculado do cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
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
