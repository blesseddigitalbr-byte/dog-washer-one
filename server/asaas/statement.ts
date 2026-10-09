import { z } from "zod";

export const statementQuerySchema = z.object({
  startDate: z.string().date(),
  finishDate: z.string().date(),
  offset: z.number().int().min(0).max(100000).default(0),
}).refine(value => value.startDate <= value.finishDate, "Data inicial posterior à final")
  .refine(value => Date.parse(value.finishDate) - Date.parse(value.startDate) <= 93 * 86400000, "Consulte no máximo 93 dias por período");

const transactionSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.string().min(1).max(160), // New Asaas types must remain visible, never silently dropped.
  date: z.string().max(40),
  value: z.number().finite(),
  description: z.string().max(2000).nullable().optional(),
  paymentId: z.string().max(160).nullable().optional(),
  transferId: z.string().max(160).nullable().optional(),
});
export function normalizeStatement(balance: unknown, statement: unknown) {
  const current = z.object({ balance: z.number().finite() }).parse(balance);
  const page = z.object({ data: z.array(transactionSchema).max(100), hasMore: z.boolean() }).parse(statement);
  const ids = new Set<string>();
  const entries = page.data.map(row => {
    if (ids.has(row.id)) throw new Error("Extrato retornou lançamento duplicado. Revise a consulta");
    ids.add(row.id);
    return { id: row.id, type: row.type, date: row.date, valueCents: Math.round(row.value * 100), description: row.description ?? null, paymentId: row.paymentId ?? null, transferId: row.transferId ?? null };
  });
  return { balanceCents: Math.round(current.balance * 100), entries, hasMore: page.hasMore,
    pageCreditsCents: entries.filter(row => row.valueCents > 0).reduce((sum, row) => sum + row.valueCents, 0),
    pageDebitsCents: -entries.filter(row => row.valueCents < 0).reduce((sum, row) => sum + row.valueCents, 0) };
}
