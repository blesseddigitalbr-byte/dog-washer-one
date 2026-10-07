import type { Express } from "express";
import { supabaseAdmin } from "../_core/supabase.js";
import { paymentEventSchema, paymentState, safeInvoiceUrl, validWebhookToken } from "./events.js";

export function registerAsaasWebhook(app: Express) {
  // Separate URL and secret for each account/CNPJ; never infer a default tenant.
  app.post("/api/asaas/webhook/:accountId", async (req, res) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.accountId)) return res.sendStatus(404);
    try {
    const { data: account, error } = await supabaseAdmin.from("payment_provider_accounts")
      .select("id, secret_reference, status, provider")
      .eq("id", req.params.accountId).eq("provider", "asaas").maybeSingle();
    if (error) return res.status(503).json({ error: "Integração indisponível" });
    if (!account || account.status !== "active") return res.sendStatus(404);
    // Reference identifies a server environment variable, not a credential in a browser.
    if (!/^ASAAS_[A-Z0-9_]+$/.test(account.secret_reference)) return res.sendStatus(503);
    const token = process.env[`${account.secret_reference}_WEBHOOK_TOKEN`];
    if (!validWebhookToken(req.header("asaas-access-token"), token)) return res.sendStatus(401);
    const parsed = paymentEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Evento de cobrança inválido" });
    const event = parsed.data;
      const { data, error: rpcError } = await supabaseAdmin.rpc("process_asaas_payment_event", {
        p_account_id: account.id, p_event_id: event.id, p_event_type: event.event,
        p_payment_id: event.payment.id, p_status: paymentState(event.event),
        p_value: event.payment.value, p_net_value: event.payment.netValue ?? null,
        p_billing_type: event.payment.billingType ?? null,
        p_due_date: event.payment.dueDate ?? null,
        p_invoice_url: safeInvoiceUrl(event.payment.invoiceUrl),
      });
      if (rpcError) throw rpcError;
      return res.status(200).json(data);
    } catch {
      // The SQL transaction rolls back both event and payment. A retry is safe.
      return res.status(503).json({ error: "Evento não processado; tente novamente" });
    }
  });
}
