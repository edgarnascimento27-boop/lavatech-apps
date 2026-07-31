// Onboarding: quando o usuário logado ainda não tem estabelecimento,
// forçamos a criação do primeiro antes de liberar o painel.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = { userId: string };

export function CreateEstablishmentScreen({ userId }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("establishments").insert({
      owner_id: userId,
      name,
      phone,
      address,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar o estabelecimento", {
        description: error.message,
      });
      return;
    }
    toast.success("Estabelecimento criado!");
    qc.invalidateQueries({ queryKey: ["establishments"] });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground shadow">
            <Store className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao LavaTech</h1>
            <p className="text-sm text-muted-foreground">
              Vamos cadastrar seu lava rápido para começar.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="e-name">Nome do estabelecimento</Label>
            <Input
              id="e-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Lava Rápido do João"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-phone">Telefone (opcional)</Label>
            <Input
              id="e-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-address">Endereço (opcional)</Label>
            <Textarea
              id="e-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            Criar estabelecimento
          </Button>
        </form>
      </div>
    </div>
  );
}
