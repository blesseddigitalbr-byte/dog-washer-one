type Identity = { unitId: string; clientId: string; petId: string };
export type RetroactiveContract = Identity & {
  id: string; contractDate: string; coverageStart: string; expiryDate: string;
  status: string; balanceBaths: number; balanceGroomings: number;
};
export type PendingPackageVisit = Identity & {
  id: string; date: string; status: string; alreadyAllocated: boolean;
  baths: number; groomings: number;
};
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
/** Read-only proposal. Never authorizes or persists consumption; commit needs database locks. */
export function previewRetroactiveAllocation(contract: RetroactiveContract, visits: PendingPackageVisit[]) {
  if (![contract.contractDate, contract.coverageStart, contract.expiryDate].every(validDate)
    || contract.coverageStart > contract.contractDate || contract.contractDate > contract.expiryDate)
    throw new Error("Período de cobertura inválido");
  if (contract.status !== "active") throw new Error("Contrato não está ativo");
  if (![contract.balanceBaths, contract.balanceGroomings].every(n => Number.isSafeInteger(n) && n >= 0))
    throw new Error("Saldo inválido");
  if (new Set(visits.map(v => v.id)).size !== visits.length) throw new Error("Atendimento duplicado");
  let baths = contract.balanceBaths, groomings = contract.balanceGroomings;
  const allocations = [...visits].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)).map(visit => {
    let reason: string | null = null;
    if (!validDate(visit.date)) reason = "invalid_date";
    else if (visit.unitId !== contract.unitId || visit.clientId !== contract.clientId || visit.petId !== contract.petId) reason = "identity_mismatch";
    else if (visit.status !== "completed") reason = "not_completed";
    else if (visit.alreadyAllocated) reason = "already_allocated";
    else if (visit.date < contract.coverageStart || visit.date > contract.expiryDate) reason = "outside_coverage";
    else if (![visit.baths, visit.groomings].every(n => Number.isSafeInteger(n) && n >= 0) || visit.baths + visit.groomings === 0) reason = "invalid_consumption";
    else if (visit.baths > baths || visit.groomings > groomings) reason = "insufficient_balance";
    if (!reason) { baths -= visit.baths; groomings -= visit.groomings; }
    return { visitId: visit.id, contractId: contract.id, eligible: reason === null, reason };
  });
  return { allocations, remainingBaths: baths, remainingGroomings: groomings };
}
