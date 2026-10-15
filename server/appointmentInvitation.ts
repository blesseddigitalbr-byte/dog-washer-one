import nodemailer from "nodemailer";
import { z } from "zod";
import { appointmentCalendar } from "../shared/appointmentCalendar";

export type InvitationResult = "accepted" | "disabled" | "missing_email" | "invalid_data" | "failed" | "not_requested";
type Appointment = Parameters<typeof appointmentCalendar>[0];
const email = z.string().max(254).email().refine(value => !/[\r\n<>;,\\]/.test(value));

// Fold content lines by UTF-8 octets, never splitting a multibyte character.
function fold(line: string): string {
  let result = "", width = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (width + size > 75) { result += "\r\n "; width = 1; }
    result += char; width += size;
  }
  return result;
}

export function invitationContent(appointment: Appointment, from: string, to: string, now = new Date()): string {
  email.parse(from); email.parse(to);
  const base = appointmentCalendar(appointment, now);
  return base.replace("CALSCALE:GREGORIAN\r\n", "CALSCALE:GREGORIAN\r\nMETHOD:REQUEST\r\n")
    .replace("END:VEVENT", [
      "SEQUENCE:0",
      `ORGANIZER:mailto:${from}`,
      `ATTENDEE;RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${to}`,
      "END:VEVENT",
    ].map(fold).join("\r\n"));
}

/** One attempt after a successful booking. No hidden retries after an ambiguous SMTP result. */
export async function sendAppointmentInvitation(input: {
  organizationId: string; unitId: string; to?: string | null; appointment: Appointment;
}): Promise<InvitationResult> {
  const env = process.env;
  if (env.APPOINTMENT_INVITES_ENABLED !== "true" ||
      !env.APPOINTMENT_INVITES_ORGANIZATION_ID || !env.APPOINTMENT_INVITES_UNIT_ID ||
      input.organizationId !== env.APPOINTMENT_INVITES_ORGANIZATION_ID ||
      input.unitId !== env.APPOINTMENT_INVITES_UNIT_ID) return "disabled";
  if (!input.to) return "missing_email";
  const from = env.APPOINTMENT_SMTP_FROM || "";
  const port = Number(env.APPOINTMENT_SMTP_PORT);
  if (!env.APPOINTMENT_SMTP_HOST || !env.APPOINTMENT_SMTP_USER || !env.APPOINTMENT_SMTP_PASSWORD ||
      ![465, 587].includes(port) || !email.safeParse(from).success) return "disabled";
  let content: string;
  try { content = invitationContent(input.appointment, from, input.to); }
  catch { return "invalid_data"; }
  const transport = nodemailer.createTransport({
    host: env.APPOINTMENT_SMTP_HOST, port, secure: port === 465, requireTLS: true,
    auth: { user: env.APPOINTMENT_SMTP_USER, pass: env.APPOINTMENT_SMTP_PASSWORD },
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    const result = await transport.sendMail({
      from: { name: "Lux Dog", address: from }, to: { address: input.to, name: "" },
      subject: "Lux Dog — compromisso de atendimento",
      text: "Seu atendimento foi agendado. Confira o horário no convite e aceite para adicionar à sua agenda. Este convite não confirma pagamento. Alterações e cancelamentos devem ser conferidos com a recepção; a sincronização automática ainda não está disponível.",
      icalEvent: { method: "REQUEST", filename: "atendimento.ics", content },
    });
    // SMTP acceptance is not delivery, opening, or client calendar acceptance.
    return result.accepted?.length === 1 && !result.rejected?.length ? "accepted" : "failed";
  } catch {
    // Never log SMTP errors: provider payloads can contain addresses or credentials.
    return "failed";
  } finally { transport.close(); }
}
