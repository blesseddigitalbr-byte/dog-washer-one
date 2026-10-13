// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { securityHeaders } from "./_core/securityHeaders";

describe("HTTP security headers", () => {
  function request(path: string) {
    const values: Record<string, string> = {};
    const next = vi.fn();
    securityHeaders({ path } as any, { setHeader: (key: string, value: string) => { values[key] = value; } } as any, next);
    return { values, next };
  }
  it("blocks framing/sniffing without blocking scripts or Supabase connections", () => {
    const { values, next } = request("/");
    expect(values["X-Frame-Options"]).toBe("DENY");
    expect(values["X-Content-Type-Options"]).toBe("nosniff");
    expect(values["Content-Security-Policy"]).not.toMatch(/script-src|connect-src|default-src/);
    expect(values["Permissions-Policy"]).toContain("camera=(self)");
    expect(next).toHaveBeenCalledOnce();
  });
  it.each(["/api", "/api/trpc/userAccess.list", "/api/asaas/webhook/test"])("prevents caching %s", path => {
    expect(request(path).values["Cache-Control"]).toBe("no-store");
  });
  it("does not disable normal asset caching", () => {
    expect(request("/assets/index.js").values["Cache-Control"]).toBeUndefined();
  });
});
