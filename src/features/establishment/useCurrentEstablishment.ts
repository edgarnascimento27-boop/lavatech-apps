// Hook utilitário: devolve o estabelecimento "corrente" (primeiro do usuário).
// Multi-estabelecimento fica para uma etapa futura — aqui centralizamos
// a decisão para não espalhar `establishments?.[0]` pelo código.

import { useMyEstablishments } from "@/data/queries/establishment";
import type { Establishment } from "@/domain/types";

export function useCurrentEstablishment(): {
  establishment: Establishment | null;
  establishmentId: string | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useMyEstablishments();
  const establishment = data?.[0] ?? null;
  return {
    establishment,
    establishmentId: establishment?.id ?? null,
    isLoading,
  };
}
