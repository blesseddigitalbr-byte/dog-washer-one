import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc.js";
import { supabaseAdmin } from "./_core/supabase.js";

const administrator = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user?.organizationId || !["owner", "admin"].includes(ctx.user.role))
    throw new TRPCError({ code: "FORBIDDEN", message: "Cadastro de usuários restrito à administração" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const createPlatformUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(12, "Use pelo menos 12 caracteres").max(128),
  role: z.enum(["admin", "manager", "staff"]),
  unitIds: z.array(z.string().uuid()).min(1).max(50).refine(ids => new Set(ids).size === ids.length),
  defaultUnitId: z.string().uuid(),
  verifiedEmail: z.literal(true),
}).refine(input => input.unitIds.includes(input.defaultUnitId), "Unidade inicial precisa estar autorizada");

export const userAccessRouter = router({
  list: administrator.query(async ({ ctx }) => {
    const { data, error } = await supabaseAdmin.from("profiles")
      .select("id, full_name, role, active, unit_id")
      .eq("organization_id", ctx.user.organizationId).order("full_name").limit(200);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível consultar os usuários" });
    return data ?? [];
  }),
  create: administrator.input(createPlatformUserSchema).mutation(async ({ ctx, input }) => {
    if (input.role === "admin" && ctx.user.role !== "owner")
      throw new TRPCError({ code: "FORBIDDEN", message: "Somente a proprietária pode criar administradores" });
    // Verify scope BEFORE creating an Auth account; never accept an organization from the browser.
    const { data: units, error } = await supabaseAdmin.from("user_unit_access")
      .select("unit_id, units!inner(is_active, organization_id)")
      .eq("user_id", ctx.user.id).eq("organization_id", ctx.user.organizationId)
      .eq("active", true).in("unit_id", input.unitIds);
    if (error || units?.length !== input.unitIds.length || units.some((row: any) => {
      const unit = Array.isArray(row.units) ? row.units[0] : row.units;
      return !unit?.is_active || unit.organization_id !== ctx.user.organizationId;
    })) throw new TRPCError({ code: "FORBIDDEN", message: "Selecione somente unidades autorizadas" });

    // A banned account cannot sign in during provisioning. No invitation is sent.
    const created = await supabaseAdmin.auth.admin.createUser({
      email: input.email, password: input.password, email_confirm: true,
      ban_duration: "876000h", user_metadata: { full_name: input.name },
    });
    if (created.error || !created.data.user)
      throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível criar o login. Confira o email e os requisitos de senha; contas existentes não são alteradas." });
    const id = created.data.user.id;
    try {
      const bound = await supabaseAdmin.rpc("provision_dwo_user_access", {
        p_actor: ctx.user.id, p_user: id, p_name: input.name, p_role: input.role,
        p_units: input.unitIds, p_default_unit: input.defaultUnitId,
      });
      if (bound.error || bound.data !== id) throw new Error("binding");
      const activated = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "none" });
      if (activated.error) throw new Error("activation");
      return { id };
    } catch {
      // Re-block both layers before cleanup, including uncertain activation responses.
      await supabaseAdmin.from("profiles").update({ active: false }).eq("id", id).then(() => undefined, () => undefined);
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876000h" }).catch(() => undefined);
      await supabaseAdmin.auth.admin.deleteUser(id).catch(() => undefined);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cadastro não concluído. Se o email já existir ao tentar novamente, peça revisão à administração; não compartilhe a senha deste cadastro." });
    }
  }),
});
