import { describe, expect, it } from "vitest";
import { appointmentCalendar } from "../shared/appointmentCalendar";

const input = { id: "abc-123", appointmentDate: "2026-10-16T09:00:00-03:00", durationMinutes: 60, status: "confirmed" };
const now = new Date("2026-10-15T12:00:00Z");
describe("manual appointment calendar", () => {
  it("uses UTC independently of the browser timezone and preserves duration", () => {
    const result = appointmentCalendar(input, now);
    expect(result).toContain("DTSTART:20261016T120000Z\r\nDTEND:20261016T130000Z");
    expect(result).toContain("DTSTAMP:20261015T120000Z");
    expect(result.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("keeps a stable event identity", () => {
    expect(appointmentCalendar(input, now)).toContain("UID:abc-123@agenda.dwo");
    expect(appointmentCalendar({ ...input, appointmentDate: "2026-10-17T09:00:00-03:00" }, now)).toContain("UID:abc-123@agenda.dwo");
  });
  it("does not invent a duration", () => expect(appointmentCalendar({ ...input, durationMinutes: null }, now)).not.toContain("DTEND"));
  it("marks pending appointments tentative", () => expect(appointmentCalendar({ ...input, status: "pending" }, now)).toContain("STATUS:TENTATIVE"));
  it.each(["cancelled", "no_show", "unknown"])("rejects %s exports", status => {
    expect(() => appointmentCalendar({ ...input, status }, now)).toThrow();
  });
  it.each([0, -1, 1.5, Infinity, 1441])("rejects invalid duration %s", durationMinutes => {
    expect(() => appointmentCalendar({ ...input, durationMinutes }, now)).toThrow();
  });
  it.each(["2026-10-16T09:00:00", "bad", "2026-99-16T09:00:00Z"])("rejects ambiguous/invalid date %s", appointmentDate => {
    expect(() => appointmentCalendar({ ...input, appointmentDate }, now)).toThrow();
  });
  it("rejects injected calendar properties", () => {
    expect(() => appointmentCalendar({ ...input, id: "x\r\nATTENDEE:evil" }, now)).toThrow();
  });
  it("contains no clients, pets, emails, payment data or automatic invitations", () => {
    const result = appointmentCalendar(input, now);
    expect(result).toContain("CLASS:PRIVATE");
    expect(result).not.toMatch(/ATTENDEE|ORGANIZER|METHOD|VALARM|DESCRIPTION/);
  });
});
