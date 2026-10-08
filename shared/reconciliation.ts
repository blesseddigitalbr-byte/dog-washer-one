export type ReconciliationState = "cancelled_payment" | "amount_mismatch" | "package_allocation_pending" | "service_link_pending" | "service_not_performed" | "professional_pending" | "execution_pending" | "receipt_pending" | "ready_for_calculation";
export function reconciliationState(input: { origin: "appointment" | "package" | "standalone"; paymentStatus?: string | null; appointmentStatus?: string | null; hasProfessional?: boolean; amountMatches?: boolean }): ReconciliationState {
  if (input.paymentStatus === "refunded" || input.paymentStatus === "deleted") return "cancelled_payment";
  if (input.amountMatches === false) return "amount_mismatch";
  if (input.origin === "package") return "package_allocation_pending";
  if (input.origin === "standalone") return "service_link_pending";
  if (["cancelled", "no_show"].includes(input.appointmentStatus ?? "")) return "service_not_performed";
  if (!input.hasProfessional) return "professional_pending";
  if (input.appointmentStatus !== "completed") return "execution_pending";
  if (input.paymentStatus !== "received") return "receipt_pending";
  return "ready_for_calculation";
}
export const reconciliationLabels: Record<ReturnType<typeof reconciliationState>, string> = {
  cancelled_payment: "Pagamento cancelado/estornado — revisar",
  amount_mismatch: "Valor divergente — revisar",
  package_allocation_pending: "Pacote — rateio por serviço pendente",
  service_link_pending: "Cobrança avulsa — vínculo ao serviço pendente",
  service_not_performed: "Serviço não realizado — sem direito gerado",
  professional_pending: "Profissional não identificado",
  execution_pending: "Aguardando conclusão do serviço",
  receipt_pending: "Serviço concluído — aguardando recebimento",
  ready_for_calculation: "Recebido e realizado — apto à apuração (não repassado)",
};
