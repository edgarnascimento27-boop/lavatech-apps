// Queries relacionadas ao estabelecimento corrente.
// Toda comunicação com backend vive na camada `data/`.

import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Establishment } from "@/domain/types";

export const myEstablishmentsQuery = () =>
  queryOptions({
    queryKey: ["establishments", "mine"],
    queryFn: async (): Promise<Establishment[]> => {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export function useMyEstablishments() {
  return useQuery(myEstablishmentsQuery());
}
