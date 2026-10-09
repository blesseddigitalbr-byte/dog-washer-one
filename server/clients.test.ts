// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
// Fail closed: no real database or provider credentials are used by this suite.
const boundary = vi.hoisted(() => ({ tenant: vi.fn(), database: vi.fn() }));
vi.mock("./_core/supabase.js", () => ({
  withTenantSupabase: boundary.tenant,
  supabase: { from: boundary.database },
  supabaseAdmin: { from: boundary.database },
}));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("business router authentication", () => {
  it.each(["clients", "appointments", "professionals"] as const)(
    "rejects anonymous %s listing without database access", async name => {
      const ctx: TrpcContext = { user: null, accessToken: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
      const caller = appRouter.createCaller(ctx);
      await expect(caller[name].list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      expect(boundary.tenant).not.toHaveBeenCalled();
      expect(boundary.database).not.toHaveBeenCalled();
    },
  );
  it("rejects student listing without login", async () => {
    const caller = appRouter.createCaller({ user: null, accessToken: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.students.list({ filter: "all" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(boundary.database).not.toHaveBeenCalled();
  });
});
