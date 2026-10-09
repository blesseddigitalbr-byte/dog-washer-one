// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const isolated = vi.hoisted(() => ({ database: vi.fn(), tenant: vi.fn(async (_jwt: string, action: () => unknown) => action()) }));
vi.mock("./_core/supabase.js", () => ({ supabase: { from: isolated.database }, supabaseAdmin: { from: isolated.database }, withTenantSupabase: isolated.tenant }));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
const ctx: TrpcContext = {
  user: { id: "test", role: "staff", email: "test@example.invalid", name: null, displayName: null, phone: null, organizationId: "test-org", unitId: "test-unit" },
  accessToken: "fake-jwt", req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
};
beforeEach(() => { isolated.database.mockClear(); });
describe("authenticated client input validation", () => {
  it.each([
    { name: "", email: "a@example.invalid", phone: "123" },
    { name: "   ", email: "a@example.invalid", phone: "123" },
    { name: "Tutor", email: "invalid", phone: "123" },
    { name: "Tutor", email: "a@example.invalid", phone: "" },
    { name: "Tutor", email: "a@example.invalid", phone: "   " },
  ])("rejects invalid client fields before database access: %j", async input => {
    await expect(appRouter.createCaller(ctx).clients.create(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(isolated.database).not.toHaveBeenCalled();
  });
});
