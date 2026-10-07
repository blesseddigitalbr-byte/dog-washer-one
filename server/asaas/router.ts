import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc.js";
import { supabase } from "../_core/supabase.js";

const financialProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || !["owner", "admin", "manager"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito à gestão financeira" });
  }
  return next();
});

export const asaasRouter = router({
  overview: financialProcedure.query(async () => {
    const [accounts, events, payments] = await Promise.all([
      supabase.from("payment_provider_accounts").select("id, environment, status, legal_entity_id").eq("provider", "asaas"),
      supabase.from("asaas_webhook_events").select("event_id, event_type, payment_id, processing_status, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("asaas_payments").select("id, external_id, status, value, net_value, billing_type, due_date, invoice_url, updated_at").order("updated_at", { ascending: false }).limit(100),
    ]);
    if (accounts.error || events.error || payments.error) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A integração precisa da migração Asaas aplicada no banco de dados." });
    }
    return { accounts: accounts.data ?? [], events: events.data ?? [], payments: payments.data ?? [] };
  }),
});
