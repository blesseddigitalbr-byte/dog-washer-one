import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc.js";
import { supabase, supabaseAdmin } from "../_core/supabase.js";
import { z } from "zod";
import { sandboxAsaas, verifiedDraftPayment } from "./client.js";
import { safeInvoiceUrl } from "./events.js";
import { reconciliationState } from "../../shared/reconciliation.js";
import { billingDraftSchema } from "../../shared/billing.js";
import { providerComparison } from "../../shared/provider-check.js";
import { normalizeStatement, statementQuerySchema } from "./statement.js";
import { invoiceCsv } from "../../shared/invoice-export.js";
import { externalInvoiceSchema } from "../../shared/external-invoice.js";

const financialProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || !["owner", "admin", "manager"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito à gestão financeira" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const asaasRouter = router({
  externalInvoices: financialProcedure.query(async ({ ctx }) => {
    if (!ctx.user.organizationId || !ctx.user.unitId) return [];
    const { data, error } = await supabase.from("external_invoices").select("id, number, issued_date, amount_cents, service_description, billing_draft_id").eq("organization_id", ctx.user.organizationId).eq("unit_id", ctx.user.unitId).order("issued_date", { ascending: false }).limit(100);
    if (error) throw new Error("Registro de notas externas indisponível. Verifique a migração fiscal");
    return data ?? [];
  }),
  registerExternalInvoice: financialProcedure.input(externalInvoiceSchema).mutation(async ({ ctx, input }) => {
    const org = ctx.user.organizationId, unit = ctx.user.unitId;
    if (!org || !unit) throw new Error("Selecione uma unidade");
    const { data: activeUnit } = await supabase.from("units").select("operation_mode, legal_entity_id").eq("id", unit).eq("organization_id", org).maybeSingle();
    if (!activeUnit?.legal_entity_id || activeUnit.operation_mode === "school") throw new Error("Registro exclusivo do salão");
    if (input.billingDraftId) {
      const { data: billing } = await supabase.from("billing_drafts").select("id, amount_cents").eq("id", input.billingDraftId).eq("organization_id", org).eq("unit_id", unit).eq("status", "issued").maybeSingle();
      if (!billing || Number(billing.amount_cents) !== input.amountCents) throw new Error("Cobrança indisponível ou valor divergente. Registre sem vínculo para conferência");
    }
    const { data, error } = await supabaseAdmin.from("external_invoices").insert({ organization_id: org, unit_id: unit, billing_draft_id: input.billingDraftId ?? null, number: input.number, access_key: input.accessKey, issued_date: input.issuedDate, amount_cents: input.amountCents, service_description: input.serviceDescription, created_by: ctx.user.id }).select("id").single();
    if (error) throw new Error("Não foi possível registrar. Confira duplicidade da chave ou nota já vinculada/em processamento");
    return data;
  }),
  exportInvoice: financialProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const org = ctx.user.organizationId, unit = ctx.user.unitId;
    if (!org || !unit) throw new Error("Selecione uma unidade");
    const { data: note, error } = await supabase.from("invoice_drafts").select("id, billing_draft_id, amount_cents, service_description, effective_date, status").eq("id", input.id).eq("organization_id", org).eq("unit_id", unit).maybeSingle();
    if (error || !note || note.status !== "awaiting_fiscal_validation") throw new Error("Rascunho indisponível para exportação");
    const { data: billing } = await supabase.from("billing_drafts").select("client_id, provider_payment_id").eq("id", note.billing_draft_id).eq("organization_id", org).eq("unit_id", unit).maybeSingle();
    if (!billing) throw new Error("Cobrança vinculada indisponível");
    const { data: client } = await supabase.from("clientes").select("nome, cpf, email").eq("id", billing.client_id).eq("organization_id", org).eq("unit_id", unit).maybeSingle();
    if (!client) throw new Error("Dados do tomador indisponíveis");
    return { filename: `preparacao-fiscal-${note.id}.csv`, csv: invoiceCsv([
      ["Organização DWO", "Unidade DWO", "Rascunho", "Cobrança DWO", "Pagamento Asaas", "Tomador", "CPF informado", "Email", "Descrição", "Valor da cobrança (R$)", "Data pretendida", "Situação", "Orientação"],
      [org, unit, note.id, note.billing_draft_id, billing.provider_payment_id, client.nome, client.cpf, client.email, note.service_description, (Number(note.amount_cents) / 100).toFixed(2).replace(".", ","), note.effective_date, "NÃO EMITIDA PELO DWO", "Conferir dados do emitente e tomador, endereço, competência, base tributável, código municipal e ISS antes da emissão. Confirmar ausência de nota já emitida."],
    ]) };
  }),
  invoiceDrafts: financialProcedure.query(async ({ ctx }) => {
    if (!ctx.user.organizationId || !ctx.user.unitId) return [];
    const { data, error } = await supabase.from("invoice_drafts").select("id, billing_draft_id, amount_cents, service_description, effective_date, status").eq("organization_id", ctx.user.organizationId).eq("unit_id", ctx.user.unitId).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Preparação fiscal indisponível. Verifique a migração de NFS-e");
    return data ?? [];
  }),
  prepareInvoice: financialProcedure.input(z.object({ billingDraftId: z.string().uuid(), serviceDescription: z.string().trim().min(5).max(2000), effectiveDate: z.string().date() })).mutation(async ({ ctx, input }) => {
    const org = ctx.user.organizationId, unit = ctx.user.unitId;
    if (!org || !unit) throw new Error("Selecione uma unidade");
    const { data: activeUnit } = await supabase.from("units").select("operation_mode, legal_entity_id").eq("id", unit).eq("organization_id", org).maybeSingle();
    if (!activeUnit?.legal_entity_id || activeUnit.operation_mode === "school") throw new Error("Esta preparação fiscal é exclusiva do salão vinculado à empresa responsável");
    const { data: billing } = await supabase.from("billing_drafts").select("id, amount_cents, provider_payment_id").eq("id", input.billingDraftId).eq("organization_id", org).eq("unit_id", unit).eq("status", "issued").maybeSingle();
    if (!billing?.provider_payment_id) throw new Error("Emita e confira a cobrança antes de preparar a nota");
    const { data: existing, error: lookupError } = await supabase.from("invoice_drafts").select("id, service_description, effective_date, status").eq("billing_draft_id", billing.id).eq("organization_id", org).eq("unit_id", unit).maybeSingle();
    if (lookupError) throw new Error("Não foi possível consultar notas já preparadas");
    if (existing) {
      if (existing.status !== "awaiting_fiscal_validation") throw new Error("Rascunho indisponível: nota registrada externamente, cancelada ou em processamento");
      if (existing.service_description !== input.serviceDescription || existing.effective_date !== input.effectiveDate) throw new Error("Esta cobrança já tem uma nota preparada com outros dados. Revisão necessária");
      return { id: existing.id };
    }
    const { data, error } = await supabase.from("invoice_drafts").insert({ billing_draft_id: billing.id, organization_id: org, unit_id: unit, amount_cents: billing.amount_cents, service_description: input.serviceDescription, effective_date: input.effectiveDate, created_by: ctx.user.id }).select("id").single();
    if (error) throw new Error("Não foi possível preparar a nota. Confira se já existe um registro");
    return data;
  }),
  sandboxStatement: financialProcedure.input(statementQuerySchema).query(async ({ ctx, input }) => {
    const org = ctx.user.organizationId, unit = ctx.user.unitId;
    if (!org || !unit) throw new Error("Selecione uma unidade");
    const { data: activeUnit } = await supabase.from("units").select("legal_entity_id, operation_mode").eq("id", unit).eq("organization_id", org).maybeSingle();
    if (!activeUnit?.legal_entity_id || activeUnit.operation_mode === "school") throw new Error("Selecione uma unidade do salão vinculada à empresa");
    const { data: accounts, error } = await supabase.from("payment_provider_accounts").select("id, secret_reference").eq("organization_id", org).eq("legal_entity_id", activeUnit.legal_entity_id).eq("provider", "asaas").eq("environment", "sandbox").eq("status", "active");
    if (error || accounts?.length !== 1) throw new Error("Configure uma única conta Asaas sandbox ativa para a empresa do salão");
    const api = sandboxAsaas(accounts[0].secret_reference);
    const parameters = new URLSearchParams({ startDate: input.startDate, finishDate: input.finishDate, offset: String(input.offset), limit: "100", order: "desc" });
    const [balance, statement] = await Promise.all([api("finance/balance"), api(`financialTransactions?${parameters}`)]);
    const normalized = normalizeStatement(balance, statement);
    const paymentIds = Array.from(new Set(normalized.entries.map(entry => entry.paymentId).filter((id): id is string => !!id)));
    const { data: drafts, error: draftError } = paymentIds.length ? await supabase.from("billing_drafts").select("id, provider_payment_id, amount_cents, appointment_id, client_package_id").eq("organization_id", org).eq("unit_id", unit).eq("account_id", accounts[0].id).eq("status", "issued").in("provider_payment_id", paymentIds) : { data: [], error: null };
    if (draftError) throw new Error("Não foi possível cruzar o extrato com cobranças da unidade");
    const entries = normalized.entries.map(entry => {
      const draft = drafts?.find(row => row.provider_payment_id === entry.paymentId);
      const match = !draft ? "unlinked" : entry.type !== "PAYMENT_RECEIVED" ? "linked_not_verified" : entry.valueCents === Number(draft.amount_cents) ? "receipt_amount_matched" : "amount_mismatch";
      return { ...entry, match, linkedDraftId: draft?.id ?? null };
    });
    return { ...normalized, entries, accountId: accounts[0].id, environment: "sandbox" as const, checkedAt: new Date().toISOString(), offset: input.offset };
  }),
  checkSandboxReceipt: financialProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const org = ctx.user.organizationId, unit = ctx.user.unitId;
    if (!org || !unit) throw new Error("Selecione uma unidade");
    const { data: draft } = await supabase.from("billing_drafts").select("*").eq("id", input.id).eq("organization_id", org).eq("unit_id", unit).eq("status", "issued").maybeSingle();
    if (!draft?.provider_payment_id || !draft.account_id) throw new Error("Cobrança vinculada não encontrada");
    const { data: account } = await supabase.from("payment_provider_accounts").select("secret_reference").eq("id", draft.account_id).eq("organization_id", org).eq("provider", "asaas").eq("environment", "sandbox").eq("status", "active").maybeSingle();
    if (!account) throw new Error("Conta sandbox de origem indisponível");
    const payment = await sandboxAsaas(account.secret_reference)(`payments/${encodeURIComponent(draft.provider_payment_id)}`);
    const { data: local, error } = await supabase.from("asaas_payments").select("status, net_value").eq("organization_id", org).eq("account_id", draft.account_id).eq("external_id", draft.provider_payment_id).maybeSingle();
    if (error) throw new Error("Não foi possível conferir o recebimento local");
    const providerNetCents = payment.netValue == null ? null : Math.round(Number(payment.netValue) * 100);
    const result = providerComparison({ identityMatches: payment.id === draft.provider_payment_id && verifiedDraftPayment(payment, draft), providerStatus: payment.status, localStatus: local?.status, providerNetCents, localNetCents: local?.net_value == null ? null : Math.round(Number(local.net_value) * 100) });
    return { id: draft.id, result, checkedAt: new Date().toISOString() };
  }),
  confirmSandboxPayment: financialProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const org = ctx.user.organizationId, unit = ctx.user.unitId;
    if (!org || !unit) throw new Error("Selecione uma unidade");
    const { data: draft } = await supabase.from("billing_drafts").select("*").eq("id", input.id).eq("organization_id", org).eq("unit_id", unit).maybeSingle();
    if (!draft || draft.status !== "issued" || !draft.provider_payment_id || !draft.account_id) throw new Error("Cobrança emitida não encontrada");
    const { data: account } = await supabase.from("payment_provider_accounts").select("secret_reference").eq("id", draft.account_id).eq("organization_id", org).eq("provider", "asaas").eq("environment", "sandbox").eq("status", "active").maybeSingle();
    if (!account) throw new Error("A simulação exige uma conta sandbox ativa");
    const api = sandboxAsaas(account.secret_reference);
    const payment = await api(`payments/${encodeURIComponent(draft.provider_payment_id)}`);
    if (!verifiedDraftPayment(payment, draft)) throw new Error("Cobrança divergente. Simulação bloqueada");
    if (payment.status === "RECEIVED") return { id: draft.id };
    if (payment.status !== "PENDING" && payment.status !== "OVERDUE") throw new Error("Esta cobrança não está disponível para simulação");
    // Sandbox only. Persisted financial status must still come from the authenticated webhook.
    await api(`sandbox/payment/${encodeURIComponent(draft.provider_payment_id)}/confirm`, {});
    return { id: draft.id };
  }),
  reconciliation: financialProcedure.query(async ({ ctx }) => {
    if (!ctx.user.unitId || !ctx.user.organizationId) return [];
    const { data: drafts, error } = await supabase.from("billing_drafts").select("id, client_id, appointment_id, client_package_id, amount_cents, account_id, provider_payment_id, status, description")
      .eq("unit_id", ctx.user.unitId).eq("organization_id", ctx.user.organizationId).eq("status", "issued").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error("Não foi possível carregar cobranças emitidas");
    if (!drafts?.length) return [];
    const paymentIds = Array.from(new Set(drafts.map(draft => draft.provider_payment_id).filter(Boolean)));
    const appointmentIds = drafts.map(draft => draft.appointment_id).filter(Boolean);
    const [payments, appointments] = await Promise.all([
      supabase.from("asaas_payments").select("account_id, external_id, status, value, net_value").eq("organization_id", ctx.user.organizationId).in("external_id", paymentIds),
      appointmentIds.length ? supabase.from("appointments").select("id, status, professional_id, student_id, client_id, total_price").eq("unit_id", ctx.user.unitId).in("id", appointmentIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (payments.error || appointments.error) throw new Error("Não foi possível conciliar recebimentos e serviços");
    return drafts.map(draft => {
      const payment = payments.data?.find(payment => payment.account_id === draft.account_id && payment.external_id === draft.provider_payment_id);
      const appointment = appointments.data?.find(appointment => appointment.id === draft.appointment_id);
      const amountMatches = payment ? Math.round(Number(payment.value) * 100) === Number(draft.amount_cents) &&
        (!appointment || Math.round(Number(appointment.total_price) * 100) === Number(draft.amount_cents)) &&
        (!draft.appointment_id || drafts.filter(other => other.appointment_id === draft.appointment_id).length === 1) : undefined;
      return { id: draft.id, description: draft.description, appointmentId: draft.appointment_id, professionalId: appointment?.professional_id ?? null,
        grossCents: Number(draft.amount_cents), netCents: payment?.net_value == null ? null : Math.round(Number(payment.net_value) * 100), paymentStatus: payment?.status ?? "awaiting_webhook", serviceStatus: appointment?.status ?? null,
        state: reconciliationState({ origin: draft.appointment_id ? "appointment" : draft.client_package_id ? "package" : "standalone", paymentStatus: payment?.status, appointmentStatus: appointment?.status, hasProfessional: !!appointment?.professional_id && appointment.client_id === draft.client_id, amountMatches, studentExecutor: !!appointment?.student_id }),
      };
    });
  }),
  issueSandboxDraft: financialProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const org = ctx.user.organizationId, unit = ctx.user.unitId;
    if (!org || !unit) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Selecione uma unidade" });
    const { data: draft, error } = await supabase.from("billing_drafts").select("*").eq("id", input.id).eq("organization_id", org).eq("unit_id", unit).maybeSingle();
    if (error || !draft) throw new Error("Rascunho não encontrado ou migração de emissão pendente");
    if (draft.status === "issued") return { id: draft.id };
    if (draft.status === "cancelled") throw new Error("Rascunho cancelado");
    if (Number(draft.amount_cents) < 500) throw new Error("Para emitir no Asaas, o valor da cobrança deve ser de pelo menos R$ 5,00");
    const { data: activeUnit } = await supabase.from("units").select("legal_entity_id, operation_mode").eq("id", unit).eq("organization_id", org).maybeSingle();
    if (!activeUnit?.legal_entity_id || activeUnit.operation_mode === "school") throw new Error("Vincule o salão à empresa responsável antes de emitir cobranças");
    const { data: accounts, error: accountError } = await supabase.from("payment_provider_accounts").select("id, secret_reference")
      .eq("organization_id", org).eq("legal_entity_id", activeUnit.legal_entity_id).eq("provider", "asaas").eq("environment", "sandbox").eq("status", "active");
    if (accountError || accounts?.length !== 1) throw new Error("Configure uma conta Asaas sandbox ativa para a empresa do salão");
    const account = accounts[0];
    if (draft.account_id && draft.account_id !== account.id) throw new Error("A conta mudou. Revise a cobrança na conta de origem");
    const api = sandboxAsaas(account.secret_reference);
    const recovery = draft.status !== "draft";
    if (!recovery) {
      const { data: claimed, error: claimError } = await supabaseAdmin.from("billing_drafts").update({ status: "issuing", account_id: account.id })
        .eq("id", draft.id).eq("organization_id", org).eq("unit_id", unit).eq("status", "draft").select("id").maybeSingle();
      if (claimError || !claimed) throw new Error("Emissão já iniciada. Atualize a lista e consulte o resultado");
    }
    const update = async (values: Record<string, unknown>) => {
      const { error } = await supabaseAdmin.from("billing_drafts").update(values).eq("id", draft.id).eq("organization_id", org).eq("unit_id", unit).eq("account_id", account.id);
      if (error) throw new Error("Não foi possível registrar o resultado. Consulte antes de repetir");
    };
    try {
      // Never repeat a POST after an ambiguous response. Recovery performs GET only.
      const existing = await api(`payments?externalReference=${encodeURIComponent(draft.id)}&limit=2`);
      let payment = existing.data?.[0];
      if ((existing.data?.length ?? 0) > 1) throw new Error("Mais de uma cobrança encontrada. Revisão necessária");
      if (!payment && recovery) throw new Error("Nenhuma cobrança localizada ainda. Não será criada outra automaticamente; revisão necessária");
      if (!payment) {
        const { data: client } = await supabase.from("clientes").select("id, nome, cpf").eq("id", draft.client_id).eq("unit_id", unit).eq("organization_id", org).maybeSingle();
        const taxId = client?.cpf?.replace(/\D/g, "") ?? "";
        if (!client || ![11, 14].includes(taxId.length)) throw new Error("Complete o CPF/CNPJ do cliente antes da emissão");
        const reference = `dwo:${org}:${client.id}`;
        const customers = await api(`customers?externalReference=${encodeURIComponent(reference)}&limit=2`);
        if ((customers.data?.length ?? 0) > 1) throw new Error("Cliente duplicado no Asaas. Revise antes de emitir");
        const customer = customers.data?.[0] ?? await api("customers", { name: client.nome, cpfCnpj: taxId, externalReference: reference, notificationDisabled: true });
        if (typeof customer.id !== "string" || !customer.id.startsWith("cus_")) throw new Error("Resposta inválida ao cadastrar cliente");
        draft.provider_customer_id = customer.id;
        await update({ provider_customer_id: customer.id });
        payment = await api("payments", { customer: customer.id, billingType: draft.billing_type, value: Number(draft.amount_cents) / 100, dueDate: draft.due_date, description: draft.description, externalReference: draft.id });
      }
      if (!verifiedDraftPayment(payment, draft)) throw new Error("Dados da cobrança divergentes do rascunho. Revisão necessária");
      await update({ status: "issued", provider_payment_id: payment.id, provider_invoice_url: safeInvoiceUrl(payment.invoiceUrl) });
      return { id: draft.id };
    } catch (error) {
      await update({ status: "needs_review" });
      throw new Error(error instanceof Error ? error.message : "Emissão sem confirmação. Consulte antes de repetir");
    }
  }),
  billingOptions: financialProcedure.query(async ({ ctx }) => {
    if (!ctx.user.unitId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Selecione uma unidade" });
    const [clients, appointments, packages] = await Promise.all([
      supabase.from("clientes").select("id, nome").eq("unit_id", ctx.user.unitId).order("nome"),
      supabase.from("appointments").select("id, client_id, appointment_date, professional_id, total_price").eq("unit_id", ctx.user.unitId).order("appointment_date", { ascending: false }).limit(200),
      supabase.from("client_packages").select("id, client_id, code, price").eq("unit_id", ctx.user.unitId).order("created_at", { ascending: false }).limit(200),
    ]);
    if (clients.error || appointments.error || packages.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível carregar as origens de cobrança" });
    return { clients: clients.data ?? [], appointments: appointments.data ?? [], packages: packages.data ?? [] };
  }),
  billingDrafts: financialProcedure.query(async ({ ctx }) => {
    if (!ctx.user.unitId) return [];
    const { data, error } = await supabase.from("billing_drafts").select("id, client_id, appointment_id, client_package_id, amount_cents, billing_type, due_date, description, status, created_at, provider_payment_id, provider_invoice_url")
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
