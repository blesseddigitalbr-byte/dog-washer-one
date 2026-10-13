import { describe, expect, it } from "vitest";
import { canAccessRoute } from "../shared/accessPolicy";
describe("route access policy", () => {
  it.each(["/financial", "/splits", "/integrations", "/branding", "/settings", "/users", "/team", "/services", "/plans"])("blocks operation at %s", path => {
    expect(canAccessRoute("staff", path)).toBe(false);
  });
  it("allows financial management but not administrative configuration", () => {
    expect(canAccessRoute("manager", "/splits")).toBe(true);
    expect(canAccessRoute("manager", "/financial")).toBe(true);
    expect(canAccessRoute("manager", "/integrations")).toBe(false);
    expect(canAccessRoute("manager", "/users")).toBe(false);
  });
  it("keeps operation working and defaults unknown roles/routes to denied", () => {
    expect(canAccessRoute("staff", "/appointments")).toBe(true);
    expect(canAccessRoute("staff", "/clients")).toBe(true);
    expect(canAccessRoute("unknown", "/")).toBe(false);
    expect(canAccessRoute("owner", "/unknown")).toBe(false);
    expect(canAccessRoute("owner", "/branding")).toBe(true);
  });
});
