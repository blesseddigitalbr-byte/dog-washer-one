import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const appointmentsPage = fs.readFileSync(
  path.join(process.cwd(), "client/src/pages/Appointments.tsx"),
  "utf8",
);

describe("navegação por período da agenda", () => {
  it("avança e retorna um dia na visualização Dia", () => {
    expect(appointmentsPage).toContain("addDays(date, 1)");
    expect(appointmentsPage).toContain("addDays(date, -1)");
  });

  it("mantém avanço semanal apenas na visualização Semana", () => {
    expect(appointmentsPage).toContain('else if (viewType === "week")');
    expect(appointmentsPage).toContain("addDays(date, 7)");
    expect(appointmentsPage).toContain("addDays(date, -7)");
  });

  it("mantém avanço mensal na visualização Mês", () => {
    expect(appointmentsPage).toContain("date.getMonth() + 1");
    expect(appointmentsPage).toContain("date.getMonth() - 1");
  });
});
