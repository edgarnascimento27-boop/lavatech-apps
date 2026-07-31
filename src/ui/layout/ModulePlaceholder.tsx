// Placeholder padrão usado nas telas que serão implementadas nas próximas etapas.

import type { ReactNode } from "react";
import { ScreenHeader } from "@/ui/layout/ScreenHeader";
import { EmptyState } from "@/ui/layout/EmptyState";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  description?: string;
};

export function ModulePlaceholder({ title, subtitle, icon, description }: Props) {
  return (
    <>
      <ScreenHeader title={title} subtitle={subtitle} />
      <div className="px-4 pb-8">
        <EmptyState
          icon={icon}
          title="Módulo em construção"
          description={description ?? "Este módulo será implementado na próxima etapa do plano."}
        />
      </div>
    </>
  );
}
