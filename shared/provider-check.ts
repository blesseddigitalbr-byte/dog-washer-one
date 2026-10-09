export function providerComparison(input: { identityMatches: boolean; providerStatus: string; localStatus?: string | null; providerNetCents: number | null; localNetCents: number | null }) {
  if (!input.identityMatches) return "identity_mismatch" as const;
  const statuses: Record<string, string> = { PENDING: "pending", OVERDUE: "overdue", CONFIRMED: "confirmed", RECEIVED: "received", REFUNDED: "refunded", DELETED: "deleted" };
  const expected = statuses[input.providerStatus];
  if (!expected) return "unsupported_status" as const;
  if (input.localStatus !== expected) return "status_mismatch" as const;
  if (input.providerNetCents !== input.localNetCents) return "net_mismatch" as const;
  return "matched" as const;
}
export const providerComparisonLabels = {
  identity_mismatch: "Cliente, referência, modalidade ou valor divergente",
  unsupported_status: "Situação do Asaas requer revisão",
  status_mismatch: "Situação local difere do Asaas — revisar webhook",
  net_mismatch: "Valor líquido divergente — revisar taxas",
  matched: "Cobrança e recebimento conferem com o Asaas",
};
