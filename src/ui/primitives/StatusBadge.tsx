// Badge semântico para exibir status da fila com token de cor consistente.

import { QUEUE_STATUS_META, type QueueStatus } from "@/domain/enums";
import { cn } from "@/lib/utils";

type Props = {
  status: QueueStatus;
  className?: string;
};

const TOKEN_CLASSES: Record<string, string> = {
  "status-waiting": "bg-status-waiting/15 text-status-waiting",
  "status-prep": "bg-status-prep/15 text-status-prep",
  "status-washing": "bg-status-washing/15 text-status-washing",
  "status-finishing": "bg-status-finishing/15 text-status-finishing",
  "status-ready": "bg-status-ready/15 text-status-ready",
  "status-done": "bg-status-done/15 text-status-done",
  "status-cancelled": "bg-status-cancelled/15 text-status-cancelled",
};

export function StatusBadge({ status, className }: Props) {
  const meta = QUEUE_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TOKEN_CLASSES[meta.token],
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: `var(--color-${meta.token})` }}
      />
      {meta.label}
    </span>
  );
}
