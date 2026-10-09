// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const tenant = vi.hoisted(() => ({ run: vi.fn(async (_token: string, operation: () => unknown) => operation()) }));
vi.mock("./_core/supabase.js", () => ({ withTenantSupabase: tenant.run }));
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

const testRouter = router({
  protected: protectedProcedure.query(() => "ok"),
  admin: adminProcedure.query(() => "ok"),
});
function context(role: "admin" | "staff" | null, accessToken: string | null): TrpcContext {
  return {
    user: role ? { id: "test", email: "test@example.invalid", name: null, displayName: null, phone: null, role, organizationId: "org", unitId: "unit" } : null,
    accessToken, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
  };
}
beforeEach(() => { tenant.run.mockClear(); });
describe("authentication boundary", () => {
  it("rejects anonymous protected calls before tenant access", async () => {
    await expect(testRouter.createCaller(context(null, null)).protected()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(tenant.run).not.toHaveBeenCalled();
  });
  it("rejects administrator context without JWT", async () => {
    await expect(testRouter.createCaller(context("admin", null)).admin()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(tenant.run).not.toHaveBeenCalled();
  });
  it("rejects authenticated non-administrators", async () => {
    await expect(testRouter.createCaller(context("staff", "fake-token")).admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("binds administrator operations to tenant context", async () => {
    expect(await testRouter.createCaller(context("admin", "fake-token")).admin()).toBe("ok");
    expect(tenant.run).toHaveBeenCalledWith("fake-token", expect.any(Function));
  });
});
