import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "client/src/pages/Appointments.tsx"), "utf8");
const form = fs.readFileSync(path.join(root, "client/src/components/AppointmentForm.tsx"), "utf8");
const router = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");

describe("detalhamento e edição segura da agenda", () => {
  it("navega um dia nas visualizações Dia e Agenda", () => {
    expect(page).toContain('else if (viewType === "week")');
    expect(page).toContain("addDays(currentDate, -1)");
    expect(page).toContain("addDays(currentDate, 1)");
  });

  it("abre detalhes e oferece edição e exclusão", () => {
    expect(page).toContain("Detalhes do agendamento");
    expect(page).toContain("Editar agendamento");
    expect(page).toContain("deleteMutation");
  });

  it("reaproveita o formulário para atualizar o atendimento", () => {
    expect(form).toContain("appointment?: any");
    expect(form).toContain("updateMutation.mutateAsync");
    expect(form).toContain("Salvar alterações");
  });

  it("protege edição e exclusão por unidade e preserva concluídos", () => {
    expect(router).toContain("update: protectedProcedure");
    expect(router).toContain("delete: protectedProcedure");
    expect(router).toContain('if (current.status === "completed")');
    expect(router).toContain('status: "cancelled"');
  });
});
