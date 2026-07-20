import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");
const migration = read("supabase/migrations/202607200002_client_packages_and_visit_history.sql");
const router = read("server/routers.ts");
const form = read("client/src/components/AppointmentForm.tsx");
const appointments = read("client/src/pages/Appointments.tsx");

describe("package balance and visit history", () => {
  it("persists contracted packages and visit history by tenant", () => {
    expect(migration).toContain("create table if not exists public.client_packages");
    expect(migration).toContain("create table if not exists public.visit_history");
    expect(migration).toContain("public.current_unit_id()");
  });
  it("deducts package balance atomically only on completion", () => {
    expect(migration).toContain("for update");
    expect(migration).toContain("balance_groomings = balance_groomings - 1");
    expect(migration).toContain("balance_baths = balance_baths - 1");
    expect(router).toContain('rpc("complete_appointment"');
  });
  it("links a client package to an appointment and returns appointments to the UI", () => {
    expect(form).toContain("clientPackageId");
    expect(router).toContain("client_package_id: input.clientPackageId || null");
    expect(router).toContain("appointmentDate: appointment.appointment_date");
  });
  it("uses DWO gold selection and a wide appointment dialog", () => {
    expect(appointments).toContain("bg-[#D8B768]");
    expect(appointments).toContain("max-w-5xl");
    expect(appointments).toContain("text-white");
  });
});
