// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("./_core/supabase.js", () => ({
  supabase: {}, supabaseAdmin: {},
  withTenantSupabase: async (_token: string, action: () => unknown) => action(),
}));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
const base = { req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
describe("Supabase logout contract", () => {
  it("rejects an unauthenticated logout API call", async () => {
    await expect(appRouter.createCaller({ ...base, user: null, accessToken: null }).auth.logout()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("acknowledges authenticated callers without requiring obsolete cookies", async () => {
    const user: NonNullable<TrpcContext["user"]> = { id: "test", role: "staff", email: "test@example.invalid", name: null, displayName: null, phone: null, organizationId: "org", unitId: "unit" };
    expect(await appRouter.createCaller({ ...base, user, accessToken: "fake-token" }).auth.logout()).toEqual({ success: true });
  });
  it("client logout calls Supabase signOut rather than treating the API acknowledgement as revocation", () => {
    const source = readFileSync(new URL("../client/src/_core/hooks/useAuth.ts", import.meta.url), "utf8");
    expect(source).toContain("await supabase.auth.signOut()");
  });
});
