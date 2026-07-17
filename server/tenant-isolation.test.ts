import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/202607170001_tenant_rls.sql",
  ),
  "utf8",
);

describe("tenant isolation foundation", () => {
  it.each([
    "clientes",
    "pets",
    "services",
    "professionals",
    "appointments",
    "students",
    "packages",
  ])("protects the %s table with tenant ownership", table => {
    expect(migration).toContain(`public.${table}`);
  });

  it("forces RLS and rejects cross-organization writes", () => {
    expect(migration).toContain("force row level security");
    expect(migration).toContain("Cross-organization write denied");
    expect(migration).toContain(
      "organization_id = public.current_organization_id()",
    );
  });

  it("protects child records through their parent", () => {
    expect(migration).toContain("tenant_parent_isolation");
    expect(migration).toContain("'galeria_pets', 'pets', 'pet_id'");
    expect(migration).toContain(
      "'package_sessions', 'packages', 'package_id'",
    );
  });
});
