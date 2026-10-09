import { z } from "zod";
export const externalInvoiceSchema = z.object({
  billingDraftId: z.string().uuid().optional(),
  number: z.string().trim().min(1).max(50),
  accessKey: z.string().trim().regex(/^\d{50}$/),
  issuedDate: z.string().date(),
  amountCents: z.number().int().positive().max(100000000),
  serviceDescription: z.string().trim().min(5).max(2000),
});
