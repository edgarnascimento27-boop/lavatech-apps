// Tela: catálogo de tipos de lavagem (CRUD).

import { useState } from "react";
import { Droplets, Plus, Pencil, Clock, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { useCurrentEstablishment } from "@/features/establishment/useCurrentEstablishment";
import { useWashTypes, useDeleteWashType, useToggleWashTypeActive } from "@/data/queries/washTypes";
import type { WashType } from "@/domain/types";
import { formatCurrency } from "@/lib/format";
import { WashTypeFormSheet } from "./WashTypeFormSheet";

export function WashTypesScreen() {
  const { establishmentId } = useCurrentEstablishment();
  const { data: washTypes, isLoading } = useWashTypes(establishmentId);
  const toggleActive = useToggleWashTypeActive(establishmentId);
  const del = useDeleteWashType(establishmentId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<WashType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WashType | null>(null);

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(wt: WashType) {
    setEditing(wt);
    setSheetOpen(true);
  }

  async function handleToggle(wt: WashType, next: boolean) {
    try {
      await toggleActive.mutateAsync({ id: wt.id, active: next });
    } catch (err) {
      toast.error("Não foi possível atualizar", {
        description: (err as Error).message,
      });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await del.mutateAsync(confirmDelete.id);
      toast.success("Serviço removido");
      setConfirmDelete(null);
    } catch (err) {
      toast.error("Não foi possível remover", {
        description: (err as Error).message,
      });
    }
  }

  return (
    <>
      <ScreenHeader
        title="Tipos de lavagem"
        subtitle="Catálogo, preço e tempo médio"
        actions={
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        }
      />

      <div className="px-4 pb-8">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : !washTypes || washTypes.length === 0 ? (
          <EmptyState
            icon={<Droplets className="h-5 w-5" />}
            title="Nenhum serviço cadastrado"
            description="Cadastre os tipos de lavagem que seu lava rápido oferece."
            action={
              <Button onClick={openNew} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Cadastrar primeiro serviço
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {washTypes.map((wt) => (
              <li key={wt.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`truncate text-base font-semibold ${
                          wt.active ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {wt.name}
                      </h3>
                      {!wt.active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    {wt.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {wt.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="font-semibold text-primary">{formatCurrency(wt.price)}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" aria-hidden />
                        {wt.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={wt.active}
                    onCheckedChange={(v) => handleToggle(wt, v)}
                    aria-label="Ativo"
                  />
                </div>

                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => openEdit(wt)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(wt)}
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
        <WashTypeFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          establishmentId={establishmentId}
          editing={editing}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.name}" será removido permanentemente. Atendimentos já realizados com
              este serviço continuam no histórico.
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
