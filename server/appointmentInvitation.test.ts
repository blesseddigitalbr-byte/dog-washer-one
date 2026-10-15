// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const smtp = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn(), create: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: smtp.create } }));
import { invitationContent, sendAppointmentInvitation } from "./appointmentInvitation";
const appointment = { id: "abc-123", appointmentDate: "2026-10-16T09:00:00-03:00", durationMinutes: 60, status: "pending" };
const input = { organizationId: "org", unitId: "unit", to: "client@example.invalid", appointment };
beforeEach(() => {
  vi.stubEnv("APPOINTMENT_INVITES_ENABLED", "true");
  vi.stubEnv("APPOINTMENT_INVITES_ORGANIZATION_ID", "org");
  vi.stubEnv("APPOINTMENT_INVITES_UNIT_ID", "unit");
  vi.stubEnv("APPOINTMENT_SMTP_HOST", "smtp.example.invalid");
  vi.stubEnv("APPOINTMENT_SMTP_PORT", "465");
  vi.stubEnv("APPOINTMENT_SMTP_USER", "sender@example.invalid");
  vi.stubEnv("APPOINTMENT_SMTP_PASSWORD", "fake-secret");
  vi.stubEnv("APPOINTMENT_SMTP_FROM", "sender@example.invalid");
  vi.clearAllMocks(); smtp.create.mockReturnValue(smtp);
  smtp.sendMail.mockResolvedValue({ accepted: [input.to], rejected: [] });
});
afterEach(() => vi.unstubAllEnvs());
describe("appointment invitations (mock SMTP, no real emails)", () => {
  it("creates a REQUEST with stable identity, organizer and RSVP", () => {
    const result = invitationContent(appointment, "sender@example.invalid", input.to);
    expect(result).toContain("METHOD:REQUEST");
    expect(result).toContain("UID:abc-123@agenda.dwo");
    expect(result).toContain("ORGANIZER:mailto:sender@example.invalid");
    expect(result.replace(/\r\n /g, "")).toContain(`ATTENDEE;RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${input.to}`);
    expect(result).toContain("STATUS:TENTATIVE");
    for (const line of result.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });
  it("rejects header injection", () => {
    expect(() => invitationContent(appointment, "sender@example.invalid", "x@example.invalid\r\nBcc:other@example.invalid")).toThrow();
  });
  it("sends a calendar MIME part and reports acceptance, not delivery", async () => {
    expect(await sendAppointmentInvitation(input)).toBe("accepted");
    expect(smtp.sendMail).toHaveBeenCalledOnce();
    expect(smtp.sendMail.mock.calls[0][0]).toMatchObject({ from: { name: "Lux Dog" }, icalEvent: { method: "REQUEST" } });
    expect(smtp.create.mock.calls[0][0]).toMatchObject({ secure: true, requireTLS: true, disableFileAccess: true, disableUrlAccess: true });
    expect(smtp.close).toHaveBeenCalledOnce();
  });
  it.each([{ organizationId: "other" }, { unitId: "qa" }])("does not send outside the configured scope %s", async change => {
    expect(await sendAppointmentInvitation({ ...input, ...change })).toBe("disabled");
    expect(smtp.create).not.toHaveBeenCalled();
  });
  it("requires explicit activation", async () => {
    vi.stubEnv("APPOINTMENT_INVITES_ENABLED", "false");
    expect(await sendAppointmentInvitation(input)).toBe("disabled");
    expect(smtp.create).not.toHaveBeenCalled();
  });
  it("does not attempt delivery without email", async () => {
    expect(await sendAppointmentInvitation({ ...input, to: null })).toBe("missing_email");
    expect(smtp.create).not.toHaveBeenCalled();
  });
  it("rejects invalid recipient before connecting", async () => {
    expect(await sendAppointmentInvitation({ ...input, to: "invalid" })).toBe("invalid_data");
    expect(smtp.create).not.toHaveBeenCalled();
  });
  it("does not retry an ambiguous failure or expose provider errors", async () => {
    smtp.sendMail.mockRejectedValue(new Error("private provider response"));
    expect(await sendAppointmentInvitation(input)).toBe("failed");
    expect(smtp.sendMail).toHaveBeenCalledOnce(); expect(smtp.close).toHaveBeenCalledOnce();
  });
  it("reports recipient rejection", async () => {
    smtp.sendMail.mockResolvedValue({ accepted: [], rejected: [input.to] });
    expect(await sendAppointmentInvitation(input)).toBe("failed");
  });
});
