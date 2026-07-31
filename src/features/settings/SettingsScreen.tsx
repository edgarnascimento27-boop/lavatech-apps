// Tela de Configurações: dados do estabelecimento + preferências operacionais.

import { useEffect, useState } from "react";
import { Store, Clock, CreditCard, Bell, Save } from "lucide-react";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCurrentEstablishment } from "@/features/establishment/useCurrentEstablishment";
import {
  useEstablishmentSettings,
  useUpdateEstablishment,
  useUpsertEstablishmentSettings,
} from "@/data/queries/settings";

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

function toTimeInput(v: string | null | undefined): string {
  if (!v) return "";
  // Postgres time vem como "HH:MM:SS" — cortamos para "HH:MM".
  return v.slice(0, 5);
}

export function SettingsScreen() {
  const { establishment, establishmentId, isLoading } = useCurrentEstablishment();
  const { data: settings } = useEstablishmentSettings(establishmentId);
  const updateEst = useUpdateEstablishment(establishmentId);
  const upsertSettings = useUpsertEstablishmentSettings(establishmentId);

  // Dados do estabelecimento
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cnpj, setCnpj] = useState("");

  // Preferências
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsPix, setAcceptsPix] = useState(true);
  const [acceptsCards, setAcceptsCards] = useState(true);
  const [notifyCustomers, setNotifyCustomers] = useState(true);

  useEffect(() => {
    if (!establishment) return;
    setName(establishment.name ?? "");
    setPhone(establishment.phone ?? "");
    setAddress(establishment.address ?? "");
    setCity(establishment.city ?? "");
    setState(establishment.state ?? "");
    setCnpj(establishment.cnpj ?? "");
  }, [establishment]);

  useEffect(() => {
    if (!settings) return;
    setOpenTime(toTimeInput(settings.open_time));
    setCloseTime(toTimeInput(settings.close_time));
    setWorkingDays(settings.working_days ?? [1, 2, 3, 4, 5, 6]);
    setAcceptsCash(settings.accepts_cash ?? true);
    setAcceptsPix(settings.accepts_pix ?? true);
    setAcceptsCards(settings.accepts_cards ?? true);
    setNotifyCustomers(settings.notify_customers ?? true);
  }, [settings]);

  function toggleDay(day: number) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  async function handleSaveEstablishment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome do estabelecimento é obrigatório.");
      return;
    }
    try {
      await updateEst.mutateAsync({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim().toUpperCase() || null,
        cnpj: cnpj.trim() || null,
      });
      toast.success("Dados atualizados");
    } catch (err) {
      toast.error("Falha ao salvar", { description: (err as Error).message });
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertSettings.mutateAsync({
        open_time: openTime || null,
        close_time: closeTime || null,
        working_days: workingDays,
        accepts_cash: acceptsCash,
        accepts_pix: acceptsPix,
        accepts_cards: acceptsCards,
        notify_customers: notifyCustomers,
      });
      toast.success("Preferências salvas");
    } catch (err) {
      toast.error("Falha ao salvar", { description: (err as Error).message });
    }
  }

  if (isLoading) {
    return (
      <>
        <ScreenHeader title="Configurações" />
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">Carregando…</p>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Configurações" subtitle="Dados do estabelecimento e operação" />

      <div className="space-y-6 px-4 pb-8">
        {/* Estabelecimento */}
        <form
          onSubmit={handleSaveEstablishment}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <SectionTitle icon={<Store className="h-4 w-4" />} title="Estabelecimento" />
          <div className="mt-4 space-y-3">
            <Field label="Nome" htmlFor="s-name" required>
              <Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Telefone" htmlFor="s-phone">
              <Input
                id="s-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-0000"
                inputMode="tel"
              />
            </Field>
            <Field label="CNPJ (opcional)" htmlFor="s-cnpj">
              <Input
                id="s-cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Endereço" htmlFor="s-addr">
              <Textarea
                id="s-addr"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <Field label="Cidade" htmlFor="s-city">
                <Input id="s-city" value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field label="UF" htmlFor="s-state">
                <Input
                  id="s-state"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                />
              </Field>
            </div>
          </div>
          <Button type="submit" className="mt-5 w-full gap-2" disabled={updateEst.isPending}>
            <Save className="h-4 w-4" />
            {updateEst.isPending ? "Salvando…" : "Salvar dados"}
          </Button>
        </form>

        {/* Preferências operacionais */}
        <form
          onSubmit={handleSaveSettings}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <SectionTitle icon={<Clock className="h-4 w-4" />} title="Horário de funcionamento" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Abre às" htmlFor="s-open">
              <Input
                id="s-open"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </Field>
            <Field label="Fecha às" htmlFor="s-close">
              <Input
                id="s-close"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Label className="text-sm">Dias de funcionamento</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const active = workingDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`h-10 min-w-11 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                    aria-pressed={active}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <SectionTitle icon={<CreditCard className="h-4 w-4" />} title="Formas de pagamento" />
            <div className="mt-3 space-y-2">
              <ToggleRow label="Dinheiro" value={acceptsCash} onChange={setAcceptsCash} />
              <ToggleRow label="Pix" value={acceptsPix} onChange={setAcceptsPix} />
              <ToggleRow
                label="Cartão (crédito/débito)"
                value={acceptsCards}
                onChange={setAcceptsCards}
              />
            </div>
          </div>

          <div className="mt-6">
            <SectionTitle icon={<Bell className="h-4 w-4" />} title="Notificações" />
            <div className="mt-3">
              <ToggleRow
                label="Avisar clientes sobre mudanças de status"
                description="Envia notificação quando o veículo avança na fila."
                value={notifyCustomers}
                onChange={setNotifyCustomers}
              />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full gap-2" disabled={upsertSettings.isPending}>
            <Save className="h-4 w-4" />
            {upsertSettings.isPending ? "Salvando…" : "Salvar preferências"}
          </Button>
        </form>
      </div>
    </>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      {title}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
