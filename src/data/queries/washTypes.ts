// Queries e mutations para tipos de lavagem.
// Toda comunicação com backend vive na camada `data/`.

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WashType } from "@/domain/types";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const washTypesQueryKey = (establishmentId: string) =>
  ["wash-types", establishmentId] as const;

export const washTypesQuery = (establishmentId: string) =>
  queryOptions({
    queryKey: washTypesQueryKey(establishmentId),
    queryFn: async (): Promise<WashType[]> => {
      const { data, error } = await supabase
        .from("wash_types")
        .select("*")
        .eq("establishment_id", establishmentId)
        .order("active", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!establishmentId,
  });

export function useWashTypes(establishmentId: string | null) {
  return useQuery({
    ...washTypesQuery(establishmentId ?? ""),
    enabled: !!establishmentId,
  });
}

type UpsertInput = Omit<TablesInsert<"wash_types">, "id"> & { id?: string };

export function useUpsertWashType(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertInput) => {
      if (input.id) {
        const { id, ...update } = input;
        const { data, error } = await supabase
          .from("wash_types")
          .update(update satisfies TablesUpdate<"wash_types">)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("wash_types").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (establishmentId) qc.invalidateQueries({ queryKey: washTypesQueryKey(establishmentId) });
    },
  });
}

export function useDeleteWashType(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wash_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (establishmentId) qc.invalidateQueries({ queryKey: washTypesQueryKey(establishmentId) });
    },
  });
}

export function useToggleWashTypeActive(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("wash_types").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (establishmentId) qc.invalidateQueries({ queryKey: washTypesQueryKey(establishmentId) });
    },
  });
}
