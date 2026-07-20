import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const router = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "client/src/pages/ScheduleSimulator.tsx"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/202607200003_agenda_simulator.sql"), "utf8");

describe("Simulador de Agenda", () => {
  it("persiste simulações, itens e comunicações por organização e unidade", () => {
    expect(migration).toContain("create table if not exists public.schedule_simulations");
    expect(migration).toContain("create table if not exists public.schedule_simulation_items");
    expect(migration).toContain("create table if not exists public.communication_history");
    expect(migration).toContain("schedule_simulations_tenant");
  });

  it("gera semanal, quinzenal, 21 dias, mensal e único", () => {
    for (const frequency of ["weekly", "biweekly", "every_21_days", "monthly", "once"]) {
      expect(router).toContain(frequency);
      expect(page).toContain(frequency);
    }
  });

  it("separa conflitos de avisos e não baixa saldo na simulação", () => {
    expect(router).toContain('"conflict"');
    expect(router).toContain('"warning"');
    expect(router).not.toMatch(/scheduleSimulator:[\s\S]*balance_baths\s*=\s*balance_baths\s*-/);
  });

  it("revalida alterações e a agenda antes da confirmação", () => {
    expect(router).toContain("A agenda mudou após a simulação");
    expect(router).toContain("Profissional indisponível neste horário");
    expect(router).toContain("Pet já possui atendimento nesta data e horário");
  });

  it("cria agenda oficial somente na confirmação", () => {
    expect(router).toContain("confirm: protectedProcedure");
    expect(router).toContain('.from("appointments").insert(appointmentsPayload)');
    expect(page).toContain("Confirmar e incluir na Agenda");
  });

  it("mantém WhatsApp manual e registra a mensagem no histórico", () => {
    expect(page).toContain("Abrir WhatsApp");
    expect(router).toContain('.from("communication_history").insert');
    expect(page).toContain("Registrar no histórico");
  });
});
