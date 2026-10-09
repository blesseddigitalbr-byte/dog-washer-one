/** Financial eligibility shared by future billing, reconciliation and closing flows.
 * Amounts are integer cents: never calculate payouts with binary currency floats.
 */
export type ServiceAllocation = {
  appointmentId: string;
  professionalId: string;
  paymentId: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  paymentStatus: "pending" | "confirmed" | "received" | "refunded";
  serviceValueCents: number;
  executionReversed?: boolean;
};

export function monthlySettlement(
  services: ServiceAllocation[],
  partnerBasisPoints: number,
  monthlyFeesCents: number,
) {
  if (!Number.isSafeInteger(partnerBasisPoints) || partnerBasisPoints < 0 || partnerBasisPoints > 10000)
    throw new Error("Percentual inválido");
  if (!Number.isSafeInteger(monthlyFeesCents) || monthlyFeesCents < 0)
    throw new Error("Taxas mensais inválidas");
  const seen = new Set<string>();
  const professionals = new Set<string>();
  let earnedCents = 0;
  const eligibleAppointmentIds: string[] = [];
  for (const service of services) {
    if (!service.appointmentId || !service.professionalId || !service.paymentId)
      throw new Error("Atendimento sem vínculo financeiro ou profissional");
    if (seen.has(service.appointmentId)) throw new Error("Atendimento duplicado no fechamento");
    seen.add(service.appointmentId);
    professionals.add(service.professionalId);
    if (professionals.size > 1) throw new Error("Fechamento deve pertencer a um único profissional");
    if (!Number.isSafeInteger(service.serviceValueCents) || service.serviceValueCents < 0)
      throw new Error("Valor do serviço inválido");
    if (service.executionReversed || service.status !== "completed" || service.paymentStatus !== "received") continue;
    earnedCents += Math.round(service.serviceValueCents * partnerBasisPoints / 10000);
    if (!Number.isSafeInteger(earnedCents)) throw new Error("Valor do fechamento excede o limite");
    eligibleAppointmentIds.push(service.appointmentId);
  }
  const deductedCents = Math.min(earnedCents, monthlyFeesCents);
  return {
    eligibleAppointmentIds, earnedCents, deductedCents,
    payableCents: earnedCents - deductedCents,
    uncoveredFeesCents: monthlyFeesCents - deductedCents,
  };
}
