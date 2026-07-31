import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/domain/types";
import type { Enums, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AppRole = Enums<"app_role">;

export const employeesQueryKey = (establishmentId: string) =>
  ["employees", establishmentId] as const;

export const employeesQuery = (establishmentId: string) =>
  queryOptions({
    queryKey: employeesQueryKey(establishmentId),
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("establishment_id", establishmentId)
        .order("active", { ascending: false })
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!establishmentId,
  });

export function useEmployees(establishmentId: string | null) {
  return useQuery({
    ...employeesQuery(establishmentId ?? ""),
    enabled: !!establishmentId,
  });
}

type UpsertEmployeeInput = Omit<TablesInsert<"employees">, "id"> & {
  id?: string;
};

export function useUpsertEmployee(establishmentId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertEmployeeInput) => {
      if (input.id) {
        const { id, ...update } = input;
        const { data, error } = await supabase
          .from("employees")
          .update(update satisfies TablesUpdate<"employees">)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase.from("employees").insert(input).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!establishmentId) return;
      qc.invalidateQueries({ queryKey: employeesQueryKey(establishmentId) });
    },
  });
}

export function useDeleteEmployee(establishmentId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!establishmentId) return;
      qc.invalidateQueries({ queryKey: employeesQueryKey(establishmentId) });
    },
  });
}

export function useToggleEmployeeActive(establishmentId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("employees").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!establishmentId) return;
      qc.invalidateQueries({ queryKey: employeesQueryKey(establishmentId) });
    },
  });
}
