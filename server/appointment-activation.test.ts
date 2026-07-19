import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const router = readFileSync(
  path.resolve(process.cwd(), "server/routers.ts"),
  "utf8",
);
const migration = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/202607190002_activate_appointments.sql",
  ),
  "utf8",
);

describe("appointment activation", () => {
  it("never accepts organization or unit identifiers from the form", () => {
    const createBlock = router.slice(
      router.indexOf("create: protectedProcedure", router.indexOf("appointments: router")),
      router.indexOf("setStatus: protectedProcedure"),
    );
    expect(createBlock).not.toContain("organizationId:");
    expect(createBlock).not.toContain("unitId:");
    expect(createBlock).toContain("ctx.user.unitId");
  });

  it("validates pet ownership and professional conflicts", () => {
    expect(router).toContain("petRes.data.client_id !== input.clientId");
    expect(router).toContain("O profissional já possui atendimento nesse horário");
  });

  it("persists price, duration, recurrence and status history", () => {
    expect(migration).toContain("total_price numeric(12,2)");
    expect(migration).toContain("recurrence_rule text");
    expect(migration).toContain("appointment_services");
    expect(migration).toContain("record_appointment_status");
  });

  it("enforces the official appointment status transitions", () => {
    expect(router).toContain('pending: ["confirmed", "cancelled", "no_show"]');
    expect(router).toContain('confirmed: ["in_progress", "cancelled", "no_show"]');
    expect(router).toContain('in_progress: ["completed", "cancelled"]');
  });
});
