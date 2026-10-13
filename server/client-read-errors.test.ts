// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const mock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("./_core/supabase.js", () => ({
  withTenantSupabase: (_token: string, op: () => unknown) => op(),
  supabase: { from: mock.from }, supabaseAdmin: { from: mock.from },
}));
import { appRouter } from "./routers";
describe("client read errors must not look like isolation success", () => {
  const ctx: TrpcContext = { user: { id: "actor", email: "test@example.invalid", name: null, displayName: null, phone: null, role: "staff", organizationId: "org", unitId: "unit" }, accessToken: "mock", req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
  function failingQuery() {
    const q: any = {};
    for (const method of ["select", "order", "eq", "limit"]) q[method] = () => q;
    q.then = (resolve: any, reject: any) => Promise.resolve({ data: null, error: { message: "test unavailable" } }).then(resolve, reject);
    mock.from.mockReturnValue(q);
  }
  it("does not return an empty list on a database error", async () => {
    failingQuery();
    await expect(appRouter.createCaller(ctx).clients.list()).rejects.toThrow("Não foi possível carregar os clientes");
  });
  it("does not return a missing client on a database error", async () => {
    failingQuery();
    await expect(appRouter.createCaller(ctx).clients.getById({ id: "d0000000-0000-4000-8000-000000000003" })).rejects.toThrow("Não foi possível carregar o cliente");
  });
});
