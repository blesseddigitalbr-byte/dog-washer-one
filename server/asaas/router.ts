import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc.js";
import { supabase } from "../_core/supabase.js";
import { billingDraftSchema } from "../../shared/billing.js";

const financialProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || !["owner", "admin", "manager"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito à gestão financeira" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const asaasRouter = router({
  billingOptions: financialProcedure.query(async ({ ctx }) => {
    if (!ctx.user.unitId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Selecione uma unidade" });
    const [clients, appointments, packages] = await Promise.all([
      supabase.from("clientes").select("id, nome").eq("unit_id", ctx.user.unitId).order("nome"),
      supabase.from("appointments").select("id, client_id, appointment_date, professional_id").eq("unit_id", ctx.user.unitId).order("appointment_date", { ascending: false }).limit(200),
      supabase.from("client_packages").select("id, client_id, code, price").eq("unit_id", ctx.user.unitId).order("created_at", { ascending: false }).limit(200),
    ]);
    if (clients.error || appointments.error || packages.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível carregar as origens de cobrança" });
    return { clients: clients.data ?? [], appointments: appointments.data ?? [], packages: packages.data ?? [] };
  }),
  billingDrafts: financialProcedure.query(async ({ ctx }) => {
    if (!ctx.user.unitId) return [];
    const { data, error } = await supabase.from("billing_drafts").select("id, client_id, appointment_id, client_package_id, amount_cents, billing_type, due_date, description, status, created_at")
      .eq("unit_id", ctx.user.unitId).order("created_at", { ascending: false }).limit(100);
    if (error) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Os rascunhos de cobrança precisam da migração 202610070003 aplicada." });
    return data ?? [];
  }),
  saveBillingDraft: financialProcedure.input(billingDraftSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user.unitId || !ctx.user.organizationId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Selecione uma unidade" });
    const row = {
      id: input.id, client_id: input.clientId, organization_id: ctx.user.organizationId,
      unit_id: ctx.user.unitId, created_by: ctx.user.id, amount_cents: input.amountCents,
      billing_type: input.billingType, due_date: input.dueDate, description: input.description,
      appointment_id: input.origin === "appointment" ? input.originId : null,
      client_package_id: input.origin === "package" ? input.originId : null,
    };
    const { error } = await supabase.from("billing_drafts").insert(row);
    if (error?.code === "23505") {
      const { data: existing } = await supabase.from("billing_drafts").select("*").eq("id", input.id).maybeSingle();
      if (existing && Object.entries(row).every(([key, value]) => existing[key] === value)) return { id: input.id };
      throw new TRPCError({ code: "CONFLICT", message: "Esse identificador já pertence a outro rascunho" });
    }
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível salvar. Verifique a migração e os vínculos com cliente, unidade e origem." });
    return { id: input.id };
  }),
  splits: financialProcedure.query(async () => {
    const { data, error } = await supabase.from("asaas_split_reconciliation")
      .select("id, account_id, payment_id, split_id, partner_name, wallet_id, status, gross_value, net_value, partner_value, verified_at, evidence_source")
      .order("verified_at", { ascending: false }).limit(100);
    if (error) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A conciliação precisa da migração de splits aplicada no banco." });
    return data ?? [];
  }),
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
