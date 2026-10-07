import { z } from "zod";

export const billingDraftSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  origin: z.enum(["standalone", "appointment", "package"]),
  originId: z.string().uuid().optional(),
  amountCents: z.number().int().positive().max(100_000_000),
  billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Data inválida"),
  description: z.string().trim().min(1).max(500),
}).superRefine((draft, ctx) => {
  if ((draft.origin === "standalone") === Boolean(draft.originId))
    ctx.addIssue({ code: "custom", path: ["originId"], message: "Origem da cobrança inválida" });
});

export function parseBrlCents(value: string): number | null {
  if (!/^\d+(?:,\d{1,2})?$/.test(value.trim())) return null;
  const [integer, decimals = ""] = value.trim().split(",");
  const cents = Number(integer) * 100 + Number(decimals.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
