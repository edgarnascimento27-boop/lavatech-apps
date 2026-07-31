// Enums do domínio — espelham os enums SQL.
// Puro TypeScript: reaproveitável na versão React Native do LavaTech.

export const AppRole = {
  Owner: "owner",
  Manager: "manager",
  Attendant: "attendant",
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const QueueStatus = {
  Aguardando: "aguardando",
  EmPreparacao: "em_preparacao",
  Lavando: "lavando",
  Finalizando: "finalizando",
  Pronto: "pronto",
  Concluido: "concluido",
  Cancelado: "cancelado",
} as const;
export type QueueStatus = (typeof QueueStatus)[keyof typeof QueueStatus];

export const PaymentMethod = {
  Dinheiro: "dinheiro",
  Pix: "pix",
  CartaoCredito: "cartao_credito",
  CartaoDebito: "cartao_debito",
  Outro: "outro",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const AppointmentStatus = {
  Pendente: "pendente",
  Confirmado: "confirmado",
  Cancelado: "cancelado",
  Concluido: "concluido",
  NaoCompareceu: "nao_compareceu",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

// Metadata visual dos status da fila (rótulo + token de cor)
export const QUEUE_STATUS_META: Record<QueueStatus, { label: string; token: string }> = {
  aguardando: { label: "Aguardando", token: "status-waiting" },
  em_preparacao: { label: "Em preparação", token: "status-prep" },
  lavando: { label: "Lavando", token: "status-washing" },
  finalizando: { label: "Finalizando", token: "status-finishing" },
  pronto: { label: "Pronto", token: "status-ready" },
  concluido: { label: "Concluído", token: "status-done" },
  cancelado: { label: "Cancelado", token: "status-cancelled" },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  outro: "Outro",
};
