// Cabeçalho padrão de cada tela do painel.
// Mantém título grande e área de ações à direita.

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function ScreenHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-4 pb-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
