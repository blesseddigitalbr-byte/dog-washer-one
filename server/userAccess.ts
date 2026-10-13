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

async function editableUser(actor: { id: string; organizationId: string | null; role: string }, id: string) {
  const { data, error } = await supabaseAdmin.from("profiles").select("id, role, active")
    .eq("organization_id", actor.organizationId).eq("id", id).maybeSingle();
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível conferir o usuário" });
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
  if (id === actor.id || data.role === "owner" || data.role === "student" || (data.role === "admin" && actor.role !== "owner"))
    throw new TRPCError({ code: "FORBIDDEN", message: "Alteração não autorizada para esta conta" });
  const result = await supabaseAdmin.auth.admin.getUserById(id);
  if (result.error || !result.data.user?.email) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível consultar o login" });
  return result.data.user;
}

export const userAccessRouter = router({
  details: administrator.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const user = await editableUser(ctx.user, input.id);
    return { id: user.id, email: user.email! };
  }),
  updateEmail: administrator.input(z.object({ id: z.string().uuid(), email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), verifiedEmail: z.literal(true) })).mutation(async ({ ctx, input }) => {
    await editableUser(ctx.user, input.id);
    const result = await supabaseAdmin.auth.admin.updateUserById(input.id, { email: input.email, email_confirm: true });
    if (result.error) throw new TRPCError({ code: "BAD_REQUEST", message: "Email não atualizado. Confira o endereço; ele pode já estar em uso." });
    return { id: input.id };
  }),
  resetPassword: administrator.input(z.object({ id: z.string().uuid(), confirmed: z.literal(true) })).mutation(async ({ ctx, input }) => {
    const user = await editableUser(ctx.user, input.id);
    const result = await supabaseAdmin.auth.resetPasswordForEmail(user.email!, { redirectTo: "https://olivedrab-emu-744435.hostingersite.com/reset-password" });
    if (result.error) {
      if (result.error.status === 429 || ["over_email_send_rate_limit", "over_request_rate_limit"].includes(result.error.code ?? ""))
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite de envio de emails atingido no Supabase. Não repita agora: aguarde a liberação da cota ou configure SMTP próprio. Nenhum novo link foi enviado." });
      if (result.error.code === "email_address_not_authorized")
        throw new TRPCError({ code: "BAD_REQUEST", message: "O serviço padrão não autoriza envio para este destinatário. A administração precisa configurar SMTP próprio." });
      throw new TRPCError({ code: "BAD_REQUEST", message: "Envio não concluído. Confira a configuração de email e aguarde antes de tentar novamente." });
    }
    return { requested: true };
  }),
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
