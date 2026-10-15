/** Manual iCalendar export (RFC 5545), not an invitation delivery/sync service. */
export function appointmentCalendar(input: {
  id: string;
  appointmentDate: string;
  durationMinutes?: number | null;
  status: string;
}, now = new Date()): string {
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(input.id)) throw new Error("Identificador inválido.");
  // Reject floating timestamps: never interpret the appointment in the browser's timezone.
  if (!/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(input.appointmentDate)) {
    throw new Error("Horário sem fuso definido. Confira o agendamento.");
  }
  const start = new Date(input.appointmentDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(now.getTime())) throw new Error("Data inválida.");
  if (!["pending", "confirmed", "in_progress", "completed"].includes(input.status)) {
    throw new Error("Este atendimento não pode ser adicionado à agenda.");
  }
  const duration = input.durationMinutes;
  if (duration != null && (!Number.isInteger(duration) || duration <= 0 || duration > 1440)) {
    throw new Error("Duração inválida. Confira o agendamento.");
  }
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DWO//Agenda//PT-BR", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${input.id}@agenda.dwo`, `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    // No guessed service duration; omission means the export only specifies a start.
    ...(duration == null ? [] : [`DTEND:${stamp(new Date(start.getTime() + duration * 60000))}`]),
    "SUMMARY:Atendimento no salão", "CLASS:PRIVATE",
    `STATUS:${input.status === "pending" ? "TENTATIVE" : "CONFIRMED"}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
