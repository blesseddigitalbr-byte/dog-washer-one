/** Server-only sandbox adapter. Production is deliberately not enabled here. */
export function sandboxAsaas(secretReference: string) {
  if (!/^ASAAS_[A-Z0-9_]+$/.test(secretReference)) throw new Error("Referência de credencial inválida");
  const token = process.env[`${secretReference}_API_KEY`];
  if (!token) throw new Error("Credencial sandbox não configurada no servidor");
  return async (path: string, body?: Record<string, unknown>) => {
    const response = await fetch(`https://api-sandbox.asaas.com/v3/${path}`, {
      method: body ? "POST" : "GET",
      headers: { access_token: token, "Content-Type": "application/json", "User-Agent": "DWO/1.0" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Asaas recusou a operação (${response.status}). Confira os dados ou a configuração da conta.`);
    return response.json();
  };
}

export function verifiedDraftPayment(payment: any, draft: any) {
  return typeof payment?.id === "string" && payment.id.startsWith("pay_") &&
    payment.externalReference === draft.id && payment.customer === draft.provider_customer_id &&
    Math.round(Number(payment.value) * 100) === Number(draft.amount_cents) &&
    payment.billingType === draft.billing_type;
}
