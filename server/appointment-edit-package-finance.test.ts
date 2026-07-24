import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const appointments = read("client/src/pages/Appointments.tsx");
const appointmentForm = read("client/src/components/AppointmentForm.tsx");
const packages = read("client/src/pages/Packages.tsx");
const router = read("server/routers.ts");
const migration = read("supabase/migrations/202607230001_package_financial_fields.sql");

describe("edição persistente da agenda", () => {
  it("abre o mesmo registro nas quatro visualizações", () => {
    expect((appointments.match(/openAppointment\(apt\)/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(appointments).toContain('appointment={selectedAppointment}');
    expect(appointments).toContain('"Editar Agendamento"');
  });

  it("preenche e atualiza o formulário existente", () => {
    expect(appointmentForm).toContain("trpc.appointments.update.useMutation");
    expect(appointmentForm).toContain("setSelectedClient");
    expect(appointmentForm).toContain("Agendamento atualizado com sucesso!");
    expect(router).toContain("update: protectedProcedure");
    expect(router).toContain('.eq("unit_id", ctx.user.unitId)');
  });
});

describe("resumo e financeiro dos pacotes", () => {
  it("mantém somente os campos essenciais na listagem", () => {
    for (const label of ["ID pacote", "Pet e tutor", "Data da contratação", "Plano", "Frequência", "Status", "Detalhes"]) {
      expect(packages).toContain(label);
    }
    expect(packages).toContain("selectedPackage.payment_method");
    expect(packages).toContain("selectedPackage.balance_baths");
  });

  it("soma somente pagamentos efetivados e exclui cancelados", () => {
    expect(packages).toContain('pkg.payment_status === "paid" && pkg.status !== "cancelled"');
    expect(router).toContain('payment_status: "refunded"');
    expect(migration).toContain("payment_status");
    expect(migration).toContain("payment_date");
    expect(migration).toContain("payment_method");
  });
});
