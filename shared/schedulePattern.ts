import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Data inválida");
export const schedulePatternSchema = z.object({
  organizationId: z.string().uuid(), unitId: z.string().uuid(),
  clientId: z.string().uuid(), petId: z.string().uuid(),
  anchorDate: date,
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  intervalDays: z.union([z.literal(7), z.literal(14), z.literal(21)]),
});
export type SchedulePattern = z.infer<typeof schedulePatternSchema>;

/** Calendar-day arithmetic, independent of the browser timezone.
 * These are suggestions, not bookings or proof of package entitlement. */
export function suggestPatternDates(input: SchedulePattern, fromDate: string, count: number) {
  const pattern = schedulePatternSchema.parse(input);
  date.parse(fromDate);
  z.number().int().min(1).max(200).parse(count);
  const day = 86_400_000;
  const anchor = Date.parse(`${pattern.anchorDate}T00:00:00Z`);
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const offset = Math.max(0, Math.ceil((from - anchor) / (day * pattern.intervalDays)));
  return Array.from({ length: count }, (_, index) => {
    const calendarDate = new Date(anchor + (offset + index) * pattern.intervalDays * day).toISOString().slice(0, 10);
    return { date: calendarDate, time: pattern.time, timezone: "America/Sao_Paulo" as const };
  });
}

/** A one-off move must not rewrite the agreed recurring pattern. */
export function applyPatternChange(input: SchedulePattern, change: {
  scope: "one_off" | "permanent"; date: string; time: string;
}) {
  const pattern = schedulePatternSchema.parse(input);
  const proposed = schedulePatternSchema.parse({ ...pattern, anchorDate: change.date, time: change.time });
  z.enum(["one_off", "permanent"]).parse(change.scope);
  return {
    pattern: change.scope === "permanent" ? proposed : pattern,
    appointmentOverride: change.scope === "one_off" ? { date: change.date, time: change.time } : null,
    requiresReview: true as const,
  };
}
