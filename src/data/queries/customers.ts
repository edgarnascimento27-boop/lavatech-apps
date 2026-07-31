// Queries e mutations de clientes e veículos.
// Toda comunicação com backend vive na camada `data/`.

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Customer, Vehicle } from "@/domain/types";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ---------- Clientes ----------

export type CustomerWithVehicles = Customer & { vehicles: Vehicle[] };

export const customersQueryKey = (establishmentId: string) =>
  ["customers", establishmentId] as const;

export const customersQuery = (establishmentId: string) =>
  queryOptions({
    queryKey: customersQueryKey(establishmentId),
    queryFn: async (): Promise<CustomerWithVehicles[]> => {
      const { data, error } = await supabase
        .from("customers")
        .select("*, vehicles(*)")
        .eq("establishment_id", establishmentId)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomerWithVehicles[];
    },
    enabled: !!establishmentId,
  });

export function useCustomers(establishmentId: string | null) {
  return useQuery({
    ...customersQuery(establishmentId ?? ""),
    enabled: !!establishmentId,
  });
}

type UpsertCustomerInput = Omit<TablesInsert<"customers">, "id"> & {
  id?: string;
};

export function useUpsertCustomer(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertCustomerInput) => {
      if (input.id) {
        const { id, ...update } = input;
        const { data, error } = await supabase
          .from("customers")
          .update(update satisfies TablesUpdate<"customers">)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("customers").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (establishmentId) qc.invalidateQueries({ queryKey: customersQueryKey(establishmentId) });
    },
  });
}

export function useDeleteCustomer(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (establishmentId) qc.invalidateQueries({ queryKey: customersQueryKey(establishmentId) });
    },
  });
}

// ---------- Veículos ----------

type UpsertVehicleInput = Omit<TablesInsert<"vehicles">, "id"> & {
  id?: string;
};

export function useUpsertVehicle(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertVehicleInput) => {
      // Normaliza placa: sem espaços e maiúscula
      const normalized: UpsertVehicleInput = {
        ...input,
        license_plate: input.license_plate.replace(/\s+/g, "").toUpperCase(),
      };
      if (normalized.id) {
        const { id, ...update } = normalized;
        const { data, error } = await supabase
          .from("vehicles")
          .update(update satisfies TablesUpdate<"vehicles">)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("vehicles").insert(normalized).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (establishmentId) qc.invalidateQueries({ queryKey: customersQueryKey(establishmentId) });
    },
  });
}

export function useDeleteVehicle(establishmentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (establishmentId) qc.invalidateQueries({ queryKey: customersQueryKey(establishmentId) });
    },
  });
}

// ---------- Utilitário: filtro de busca (nome/telefone/placa) ----------

export function filterCustomers(
  customers: CustomerWithVehicles[] | undefined,
  query: string,
): CustomerWithVehicles[] {
  if (!customers) return [];
  const q = query.trim().toLowerCase();
  if (!q) return customers;
  const qDigits = q.replace(/\D/g, "");
  const qPlate = q.replace(/\s+/g, "").toUpperCase();
  return customers.filter((c) => {
    if (c.full_name.toLowerCase().includes(q)) return true;
    if (qDigits && c.phone && c.phone.replace(/\D/g, "").includes(qDigits)) return true;
    if (c.vehicles.some((v) => v.license_plate.replace(/\s+/g, "").toUpperCase().includes(qPlate)))
      return true;
    return false;
  });
}
