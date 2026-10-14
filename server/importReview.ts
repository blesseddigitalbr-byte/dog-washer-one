import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc.js";
import { supabaseAdmin } from "./_core/supabase.js";

const reviewer = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !["owner", "admin"].includes(ctx.user.role) || !ctx.user.organizationId || !ctx.user.unitId)
    throw new TRPCError({ code: "FORBIDDEN", message: "Revisão restrita à administração" });
  const { data, error } = await supabaseAdmin.from("user_unit_access")
    .select("unit_id, units!inner(is_active,organization_id)").eq("user_id",ctx.user.id)
    .eq("organization_id",ctx.user.organizationId).eq("unit_id",ctx.user.unitId).maybeSingle();
  const unit = data?.units as unknown as { is_active: boolean; organization_id: string } | null;
  if (error || !unit?.is_active || unit.organization_id !== ctx.user.organizationId)
    throw new TRPCError({ code: "FORBIDDEN", message: "Unidade não autorizada" });
  return next({ctx:{...ctx,user:ctx.user}});
});
export const importAdjustmentSchema = z.object({
  id:z.string().uuid(), version:z.number().int().nonnegative(),
  field:z.string().min(1).max(100), value:z.string().max(2000), reason:z.string().trim().min(10).max(1000),
});
export const importReviewRouter = router({
  list: reviewer.input(z.object({offset:z.number().int().min(0).default(0)}).default({offset:0})).query(async ({ctx,input}) => {
    const {data,error,count} = await supabaseAdmin.from("import_review_rows")
      .select("*",{count:"exact"}).eq("organization_id",ctx.user.organizationId).eq("unit_id",ctx.user.unitId)
      .order("source_sheet").order("source_row").order("id").range(input.offset,input.offset+49);
    if(error) throw new TRPCError({code:"INTERNAL_SERVER_ERROR",message:"Revisão indisponível"});
    return {rows:data??[],total:count??0};
  }),
  adjust: reviewer.input(importAdjustmentSchema).mutation(async ({ctx,input}) => {
    const {data,error} = await supabaseAdmin.rpc("adjust_import_review",{
      p_actor:ctx.user.id,p_row:input.id,p_version:input.version,p_field:input.field,p_value:input.value,p_reason:input.reason,
    });
    if(error) throw new TRPCError({code:error.code==="40001"?"CONFLICT":error.code==="42501"?"FORBIDDEN":"BAD_REQUEST",message:error.code==="40001"?"Outro ajuste foi salvo. Recarregue antes de editar.":"Ajuste não salvo. Confira o registro e as permissões."});
    return {version:data as number};
  }),
});
