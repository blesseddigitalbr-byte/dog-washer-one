// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("./_core/supabase.js", () => ({ supabase: db, supabaseAdmin: db, withTenantSupabase: (_t: string, fn: () => unknown) => fn() }));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
const id = "11111111-1111-4111-8111-111111111111";
const ctx: TrpcContext = { user: { id, role: "staff", email: "test@example.invalid", name: null, displayName: null, phone: null, organizationId: id, unitId: id }, accessToken: "test", req: {} as any, res: {} as any };
beforeEach(() => vi.clearAllMocks());
describe("management APIs reject operation before database access", () => {
  const cases = [
    (c: ReturnType<typeof appRouter.createCaller>) => c.packages.create({ name: "Test", audienceCode: "TEST", durationMonths: 1, totalBaths: 4, totalGroomings: 0, totalPrice: 100 }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.packages.update({ id, totalPrice: 0 }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.packages.delete({ id }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.clientPackages.create({ clientId: id, petId: id, baths: 100, groomings: 10, price: 0 }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.clientPackages.update({ id, price: 0 }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.clientPackages.cancel({ id }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.services.create({ name: "Test", price: 0, durationMinutes: 60 }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.services.update({ id, price: 0 }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.services.delete({ id }),
    (c: ReturnType<typeof appRouter.createCaller>) => c.professionals.delete({ id }),
  ];
  for (const role of ["staff", "student"] as const) {
    it.each(cases.map((call, index) => ({ call, index })))(`${role}: route $index`, async ({ call }) => {
      await expect(call(appRouter.createCaller({ ...ctx, user: { ...ctx.user!, role } }))).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.from).not.toHaveBeenCalled(); expect(db.rpc).not.toHaveBeenCalled();
    });
  }
  it.each(["owner", "admin", "manager"] as const)("allows %s to reach a scoped plan write", async role => {
    const q: any = {}; for (const method of ["update", "eq"]) q[method] = vi.fn(() => q);
    q.then = (resolve: any) => Promise.resolve({ error: null }).then(resolve);
    db.from.mockReturnValue(q);
    await appRouter.createCaller({ ...ctx, user: { ...ctx.user!, role } }).packages.delete({ id });
    expect(q.eq).toHaveBeenCalledWith("unit_id", id);
  });
});

describe("direct-ID reads repeat the active unit at the API boundary", () => {
  it.each(["clients", "packages", "services", "professionals", "students"] as const)("%s.getById filters by unit", async resource => {
    const q: any = {};
    for (const method of ["select", "eq", "limit"]) q[method] = vi.fn(() => q);
    q.single = vi.fn(async () => ({ data: null, error: null }));
    q.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
    db.from.mockReturnValue(q);
    await appRouter.createCaller(ctx)[resource].getById({ id });
    expect(q.eq).toHaveBeenCalledWith("unit_id", ctx.user!.unitId);
  });
  it("rejects a pet parent not visible in the active unit before insertion", async () => {
    const q: any = {};
    for (const method of ["select", "eq"]) q[method] = vi.fn(() => q);
    q.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    db.from.mockReturnValue(q);
    await expect(appRouter.createCaller(ctx).pets.create({ clientId: id, name: "Test", breed: "Test", weight: "1" })).rejects.toThrow();
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.from).toHaveBeenCalledWith("clientes");
    expect(q.eq).toHaveBeenCalledWith("unit_id", ctx.user!.unitId);
  });
});
