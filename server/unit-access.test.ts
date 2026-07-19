import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.resolve(
    process.cwd(),
    "supabase/migrations/202607190001_unit_access_context.sql",
  ),
  "utf8",
);

describe("unit access context", () => {
  it("stores one access record per user and unit", () => {
    expect(migration).toContain("unique (user_id, unit_id)");
    expect(migration).toContain("references public.profiles(id)");
    expect(migration).toContain("references public.units(id)");
  });

  it("only exposes the authenticated user's access records", () => {
    expect(migration).toContain("user_id = auth.uid()");
    expect(migration).toContain(
      "organization_id = public.current_organization_id()",
    );
  });

  it("rejects inactive, unauthorized and cross-organization units", () => {
    expect(migration).toContain("access.user_id = current_user_id");
    expect(migration).toContain("access.organization_id = current_org_id");
    expect(migration).toContain("unit.organization_id = current_org_id");
    expect(migration).toContain("unit.is_active = true");
    expect(migration).toContain("Unit access denied");
  });

  it("keeps unit switching behind an authenticated database function", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("revoke all on function");
    expect(migration).toContain("grant execute");
    expect(migration).toContain("to authenticated");
  });
});
