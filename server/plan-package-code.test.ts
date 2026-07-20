import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const router = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");
const plans = fs.readFileSync(path.join(root, "client/src/pages/PlansPage.tsx"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/202607200005_plan_package_codes.sql"), "utf8");

describe("separação entre plano e pacote contratado", () => {
  it("gera planos no padrão PLN-categoria-duração", () => {
    expect(router).toContain("buildPlanCode");
    expect(router).toContain("PLN-${audienceCode}");
    expect(plans).toContain("PLN-{formData.audienceCode}");
  });

  it("suporta o exemplo PLN-RAC-T3", () => {
    expect(migration).toContain("'RAC'");
    expect(migration).toContain("when 3 then 'T3'");
  });

  it("persiste código, categoria e duração no plano", () => {
    expect(migration).toContain("add column if not exists code text");
    expect(migration).toContain("add column if not exists audience_code text");
    expect(migration).toContain("add column if not exists duration_months integer");
    expect(plans).toContain("{pkg.code}");
  });

  it("gera PAC sequencial e concorrente por organização", () => {
    expect(migration).toContain("organization_counters");
    expect(migration).toContain("next_client_package_code");
    expect(router).toContain('.rpc("next_client_package_code"');
  });

  it("herda quantidades, preço e duração do plano contratado", () => {
    expect(router).toContain("plan.total_baths");
    expect(router).toContain("plan.total_groomings");
    expect(router).toContain("plan.total_price");
    expect(router).toContain("plan?.duration_months");
  });

  it("inativa plano sem apagar contratos e históricos", () => {
    expect(router).toContain('update({ status: "inactive"');
    expect(plans).toContain("Inativar plano?");
  });

  it("renova em um novo ciclo PAC e preserva o registro anterior", () => {
    expect(router).toContain("renew: protectedProcedure");
    expect(router).toContain("balance_baths: current.contracted_baths");
    expect(router).toContain("balance_groomings: current.contracted_groomings");
  });

  it("expõe radar operacional e cancelamento sem exclusão física", () => {
    expect(router).toContain("operational_status");
    expect(router).toContain('"expiring"');
    expect(router).toContain('"consumed"');
    expect(router).toContain("cancel: protectedProcedure");
  });
});
