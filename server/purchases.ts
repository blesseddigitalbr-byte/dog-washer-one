import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "./_core/trpc.js";
import { supabase } from "./_core/supabase.js";
import { management } from "./supplies.js";
const cents = z.number().int().min(0).max(1e12);
const page = z
  .object({ offset: z.number().int().min(0).default(0) })
  .default({ offset: 0 });
export const supplierSchema = z.object({
  name: z.string().trim().min(2).max(160),
  document: z.string().trim().max(30).default(""),
  email: z
    .union([z.string().trim().email().max(254), z.literal("")])
    .default(""),
  phone: z.string().trim().max(40).default(""),
});
export const purchaseDocumentSchema = z.object({
  supplierId: z.string().uuid(),
  number: z.string().trim().min(1).max(80),
  series: z.string().trim().max(20).default(""),
  issueDate: z.string().date(),
  totalCents: cents,
  accessKey: z.string().trim().max(100).default(""),
  notes: z.string().trim().max(1000).default(""),
});
export const manualPaymentSchema = z.object({
  documentId: z.string().uuid(),
  requestId: z.string().uuid(),
  amountCents: cents.refine(v => v > 0),
  date: z.string().date(),
  method: z.enum([
    "PIX",
    "BOLETO",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "CASH",
    "OTHER",
  ]),
  reference: z.string().trim().min(3).max(200),
});
function writeError(error: any) {
  throw new TRPCError({
    code:
      error.code === "40001"
        ? "CONFLICT"
        : error.code === "42501"
          ? "FORBIDDEN"
          : "BAD_REQUEST",
    message:
      error.code === "23505"
        ? "Documento ou cadastro já registrado nesta unidade."
        : error.code === "40001"
          ? "Pedido já usado com outros dados. Atualize a consulta."
          : "Registro não salvo. Confira saldo da nota, data, dados e permissões.",
  });
}
export const purchasesRouter = router({
  suppliers: management.input(page).query(async ({ ctx, input }) => {
    const { data, error, count } = await supabase
      .from("salon_suppliers")
      .select("*", { count: "exact" })
      .eq("organization_id", ctx.user.organizationId)
      .eq("unit_id", ctx.user.unitId)
      .order("name")
      .order("id")
      .range(input.offset, input.offset + 49);
    if (error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Fornecedores indisponíveis",
      });
    return { rows: data ?? [], total: count ?? 0 };
  }),
  createSupplier: management
    .input(supplierSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from("salon_suppliers")
        .insert({
          organization_id: ctx.user.organizationId,
          unit_id: ctx.user.unitId,
          name: input.name,
          document: input.document || null,
          email: input.email || null,
          phone: input.phone || null,
        })
        .select()
        .single();
      if (error) writeError(error);
      return data;
    }),
  updateSupplier: management
    .input(
      supplierSchema.extend({
        id: z.string().uuid(),
        isActive: z.boolean(),
        expectedUpdatedAt: z.string().min(1).max(80),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from("salon_suppliers")
        .update({
          name: input.name,
          document: input.document || null,
          email: input.email || null,
          phone: input.phone || null,
          is_active: input.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("organization_id", ctx.user.organizationId)
        .eq("unit_id", ctx.user.unitId)
        .eq("updated_at", input.expectedUpdatedAt)
        .select()
        .maybeSingle();
      if (error) writeError(error);
      if (!data)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Cadastro alterado ou indisponível. Atualize antes de salvar.",
        });
      return data;
    }),
  documents: management
    .input(
      z
        .object({
          offset: z.number().int().min(0).default(0),
          number: z.string().trim().max(80).optional(),
        })
        .default({ offset: 0 })
    )
    .query(async ({ ctx, input }) => {
      let q = supabase
        .from("supplier_document_summary")
        .select("*", { count: "exact" })
        .eq("organization_id", ctx.user.organizationId)
        .eq("unit_id", ctx.user.unitId)
        .order("issue_date", { ascending: false })
        .order("id");
      if (input.number) q = q.eq("number", input.number);
      const { data, error, count } = await q.range(
        input.offset,
        input.offset + 49
      );
      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Notas de compra indisponíveis",
        });
      const rows = data ?? [];
      if (rows.length) {
        const suppliers = await supabase
          .from("salon_suppliers")
          .select("id,name")
          .eq("organization_id", ctx.user.organizationId)
          .eq("unit_id", ctx.user.unitId)
          .in("id", Array.from(new Set(rows.map((d: any) => d.supplier_id))));
        if (suppliers.error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Fornecedores das notas indisponíveis",
          });
        const names = new Map(
          (suppliers.data ?? []).map((s: any) => [s.id, s.name])
        );
        return {
          rows: rows.map((d: any) => ({
            ...d,
            supplier_name: d.supplier_snapshot?.name ?? names.get(d.supplier_id),
          })),
          total: count ?? 0,
        };
      }
      return { rows: [], total: count ?? 0 };
    }),
  createDocument: management
    .input(purchaseDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from("supplier_documents")
        .insert({
          organization_id: ctx.user.organizationId,
          unit_id: ctx.user.unitId,
          supplier_id: input.supplierId,
          number: input.number,
          series: input.series,
          issue_date: input.issueDate,
          total_cents: input.totalCents,
          access_key: input.accessKey || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) writeError(error);
      return data;
    }),
  recordPayment: management
    .input(manualPaymentSchema)
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.rpc("record_supplier_payment", {
        p_document: input.documentId,
        p_request: input.requestId,
        p_amount: input.amountCents,
        p_date: input.date,
        p_method: input.method,
        p_reference: input.reference,
      });
      if (error) writeError(error);
      return { id: data as string };
    }),
  payments: management
    .input(
      z.object({
        documentId: z.string().uuid(),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error, count } = await supabase
        .from("supplier_document_payments")
        .select("*", { count: "exact" })
        .eq("organization_id", ctx.user.organizationId)
        .eq("unit_id", ctx.user.unitId)
        .eq("document_id", input.documentId)
        .order("payment_date", { ascending: false })
        .order("id")
        .range(input.offset, input.offset + 49);
      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Pagamentos indisponíveis",
        });
      return { rows: data ?? [], total: count ?? 0 };
    }),
});
