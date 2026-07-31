// Queries/mutations para dados do estabelecimento e das preferências
// (`establishment_settings`). São 1:1 — tratamos como uma "página de config".

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Establishment, EstablishmentSettings } from "@/domain/types";
import type { TablesUpdate } from "@/integrations/supabase/types";

export const establishmentSettingsKey = (establishmentId: string) =>
  ["establishment-settings", establishmentId] as const;

export const establishmentSettingsQuery = (establishmentId: string) =>
  queryOptions({
    queryKey: establishmentSettingsKey(establishmentId),
    queryFn: async (): Promise<EstablishmentSettings | null> => {
      const { data, error } = await supabase
        .from("establishment_settings")
        .select("*")
        .eq("establishment_id", establishmentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!establishmentId,
  });

export function useEstablishmentSettings(establishmentId: string | null) {
  return useQuery({
    ...establishmentSettingsQuery(establishmentId ?? ""),
    enabled: !!establishmentId,
  });
}

export function useUpdateEstablishment(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: TablesUpdate<"establishments">) => {
      if (!establishmentId) throw new Error("Sem estabelecimento selecionado.");
      const { data, error } = await supabase
        .from("establishments")
        .update(update)
        .eq("id", establishmentId)
        .select()
        .single();
      if (error) throw error;
      return data as Establishment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["establishments"] });
    },
  });
}

export function useUpsertEstablishmentSettings(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      update: Omit<TablesUpdate<"establishment_settings">, "establishment_id">,
    ) => {
      if (!establishmentId) throw new Error("Sem estabelecimento selecionado.");
      // upsert por PK (establishment_id)
      const { data, error } = await supabase
        .from("establishment_settings")
        .upsert(
          { establishment_id: establishmentId, ...update },
          { onConflict: "establishment_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data as EstablishmentSettings;
    },
    onSuccess: () => {
      if (establishmentId)
        qc.invalidateQueries({
          queryKey: establishmentSettingsKey(establishmentId),
        });
    },
  });
}
