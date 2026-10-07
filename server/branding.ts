import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc.js";
import { supabase } from "./_core/supabase.js";
import { brandingSchema, neutralBrand } from "../shared/branding.js";
export const brandingRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.organizationId) return neutralBrand;
    const { data, error } = await supabase.from("organization_branding").select("display_name, signature, primary_color, secondary_color, background_color").eq("organization_id", ctx.user.organizationId).maybeSingle();
    if (error) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configuração de marca indisponível" });
    return data ? brandingSchema.parse(data) : neutralBrand;
  }),
  save: protectedProcedure.input(brandingSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user?.organizationId || !["owner", "admin"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Somente administradores podem alterar a marca" });
    const { error } = await supabase.from("organization_branding").upsert({ organization_id: ctx.user.organizationId, ...input, updated_at: new Date().toISOString() });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível salvar a marca" });
    return { saved: true };
  }),
});
