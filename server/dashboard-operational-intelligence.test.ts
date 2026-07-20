import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dashboard = fs.readFileSync(
  path.join(process.cwd(), "client/src/pages/Home.tsx"),
  "utf8",
);

describe("inteligência operacional do Dashboard", () => {
  it("usa pacotes contratados, não planos do catálogo, no indicador e radar", () => {
    expect(dashboard).toContain("trpc.clientPackages.list.useQuery()");
    expect(dashboard).toContain("packageRadar");
    expect(dashboard).toContain("clientPackages.filter");
  });

  it("limita aniversariantes a hoje e próximos sete dias", () => {
    expect(dashboard).toContain("pet.daysUntil <= 7");
    expect(dashboard).toContain("Hoje e próximos 7 dias");
  });

  it("permite operar o status sobre a Agenda oficial", () => {
    expect(dashboard).toContain("trpc.appointments.setStatus.useMutation");
    expect(dashboard).toContain('toast.success("Agenda oficial atualizada")');
  });

  it("gera alertas de completude para cliente e pet", () => {
    expect(dashboard).toContain("incompleteClients");
    expect(dashboard).toContain("incompletePets");
    expect(dashboard).toContain("data de nascimento");
  });

  it("oferece ação manual de WhatsApp sem envio automático", () => {
    expect(dashboard).toContain("https://wa.me/");
    expect(dashboard).toContain('target="_blank"');
  });
});
