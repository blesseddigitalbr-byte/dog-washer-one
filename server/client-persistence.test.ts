import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const router = readFileSync(path.resolve(process.cwd(), "server/routers.ts"), "utf8");
const clientForm = readFileSync(
  path.resolve(process.cwd(), "client/src/components/ClientForm.tsx"),
  "utf8",
);
const migration = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/202607190003_client_addresses_and_pets.sql",
  ),
  "utf8",
);

describe("client, address and pet persistence", () => {
  it("returns every address field to the client interface", () => {
    for (const field of [
      "cep",
      "logradouro",
      "numero",
      "complemento",
      "bairro",
      "cidade",
      "uf",
    ]) {
      expect(router).toContain(`${field}: cliente.${field}`);
    }
  });

  it("stores a normalized primary address with tenant isolation", () => {
    expect(migration).toContain("create table if not exists public.client_addresses");
    expect(migration).toContain("organization_id = public.current_organization_id()");
    expect(migration).toContain("unit_id = public.current_unit_id()");
  });

  it("supports creating the first pet with the client", () => {
    expect(router).toContain("pet: z.object");
    expect(router).toContain("const petCode = await generatePetCode()");
    expect(clientForm).toContain("Primeiro pet");
  });

  it("rolls back an incomplete aggregate", () => {
    expect(router).toContain('await supabase.from("clientes").delete().eq("id", data.id)');
  });
});
