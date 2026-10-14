import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc.js";
import { supabase } from "./_core/supabase.js";
export const management = protectedProcedure.use(({ ctx, next }) => {
  if (
    !ctx.user ||
    !["owner", "admin", "manager"].includes(ctx.user.role) ||
    !ctx.user.organizationId ||
    !ctx.user.unitId
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Estoque restrito à gestão da unidade",
    });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
const quantity = z
  .number()
  .finite()
  .min(0)
  .max(1e9)
  .refine(
    v => Math.abs(v * 1000 - Math.round(v * 1000)) < 0.000001,
    "Use no máximo 3 casas decimais"
  );
export const createSupplySchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(40)
    .regex(/^[A-Z0-9._-]+$/),
  measure: z.enum(["un", "ml", "g"]),
  minimumStock: quantity.default(0),
});
export const supplyMovementSchema = z
  .object({
    id: z.string().uuid(),
    requestId: z.string().uuid(),
    version: z.number().int().nonnegative(),
    kind: z.enum(["purchase", "consumption", "loss"]),
    quantity: quantity.refine(v => v > 0),
    purchaseCostCents: z.number().int().min(0).max(1e12).optional(),
    documentId: z.string().uuid().optional(),
    reason: z.string().trim().min(3).max(1000),
  })
  .refine(
    v =>
      v.kind === "purchase"
        ? v.purchaseCostCents !== undefined
        : v.purchaseCostCents === undefined && v.documentId === undefined,
    "Informe custo e nota somente para entrada"
  );
const page = z
  .object({ offset: z.number().int().min(0).default(0) })
  .default({ offset: 0 });
function fail(error: any) {
  throw new TRPCError({
    code:
      error.code === "40001"
        ? "CONFLICT"
        : error.code === "42501"
          ? "FORBIDDEN"
          : "BAD_REQUEST",
    message:
      error.code === "40001"
        ? "O estoque mudou ou o pedido já foi usado. Atualize antes de tentar novamente."
        : error.code === "23505"
          ? "Esse código já existe na unidade."
          : "Não foi possível salvar. Confira quantidade, saldo, custo e permissões.",
  });
}
export const suppliesRouter = router({
  list: management.input(page).query(async ({ ctx, input }) => {
    const { data, error, count } = await supabase
      .from("salon_supplies")
      .select("*", { count: "exact" })
      .eq("organization_id", ctx.user.organizationId)
      .eq("unit_id", ctx.user.unitId)
      .order("name")
      .order("id")
      .range(input.offset, input.offset + 49);
    if (error)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Estoque indisponível",
      });
    return { rows: data ?? [], total: count ?? 0 };
  }),
  create: management
    .input(createSupplySchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from("salon_supplies")
        .insert({
          organization_id: ctx.user.organizationId,
          unit_id: ctx.user.unitId,
          name: input.name,
          sku: input.sku,
          measure: input.measure,
          minimum_stock: input.minimumStock,
        })
        .select()
        .single();
      if (error) fail(error);
      return data;
    }),
  update: management
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(2).max(120),
        minimumStock: quantity,
        isActive: z.boolean(),
        expectedUpdatedAt: z.string().min(1).max(80),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await supabase
        .from("salon_supplies")
        .update({
          name: input.name,
          minimum_stock: input.minimumStock,
          is_active: input.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("organization_id", ctx.user.organizationId)
        .eq("unit_id", ctx.user.unitId)
        .eq("updated_at", input.expectedUpdatedAt)
        .select()
        .maybeSingle();
      if (error) fail(error);
      if (!data)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "O cadastro mudou ou não está disponível. Recarregue antes de salvar.",
        });
      return data;
    }),
  move: management.input(supplyMovementSchema).mutation(async ({ input }) => {
    const { data, error } = await supabase.rpc("move_salon_supply", {
      p_product: input.id,
      p_request: input.requestId,
      p_version: input.version,
      p_kind: input.kind,
      p_quantity: input.quantity,
      p_cost: input.purchaseCostCents ?? null,
      p_reason: input.reason,
      p_document: input.documentId ?? null,
    });
    if (error) fail(error);
    return data as { version: number; stock: number; replayed: boolean };
  }),
  history: management
    .input(
      z.object({
        id: z.string().uuid(),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error, count } = await supabase
        .from("salon_supply_movements")
        .select("*", { count: "exact" })
        .eq("organization_id", ctx.user.organizationId)
        .eq("unit_id", ctx.user.unitId)
        .eq("product_id", input.id)
        .order("created_at", { ascending: false })
        .order("id")
        .range(input.offset, input.offset + 49);
      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Histórico indisponível",
        });
      return { rows: data ?? [], total: count ?? 0 };
    }),
});
