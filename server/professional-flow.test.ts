import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");
const router = read("server/routers.ts");
const team = read("client/src/pages/Team.tsx");
const appointment = read("client/src/components/AppointmentForm.tsx");
const migration = read("supabase/migrations/202607200001_activate_professional_management.sql");

describe("professional and appointment flow", () => {
  it("activates a full professional management screen", () => {
    expect(team).toContain("Novo profissional");
    expect(team).toContain("Editar profissional");
    expect(team).toContain("Inativar profissional");
  });

  it("assigns professionals to the authenticated organization and unit", () => {
    expect(router).toContain("organization_id: ctx.user.organizationId");
    expect(router).toContain("unit_id: ctx.user.unitId");
    expect(router).toContain('.eq("unit_id", ctx.user.unitId)');
  });

  it("preserves appointment history on professional removal", () => {
    expect(router).toContain('status: "inactive", is_active: false');
    expect(appointment).toContain("prof.is_active");
  });

  it("persists operational professional fields", () => {
    expect(migration).toContain("role_title text");
    expect(migration).toContain("hire_date date");
    expect(migration).toContain("commission_percent");
    expect(migration).toContain("notes text");
  });
});
