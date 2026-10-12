// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), tenant: vi.fn(async (_token: string, op: () => unknown) => op()) }));
vi.mock("./_core/supabase.js", () => ({ supabase: { from: m.from, rpc: m.rpc }, supabaseAdmin: {}, withTenantSupabase: m.tenant }));
import { appRouter } from "./routers";
const id = "11111111-1111-4111-8111-111111111111";
const ctx: any = { user: { id, role: "staff", organizationId: "org", unitId: "unit" }, accessToken: "fake-jwt", req: {}, res: {} };
beforeEach(() => { m.from.mockReset(); m.rpc.mockReset(); });
describe("isolated atomic simulation confirmation API", () => {
  it("requires authentication before any database call", async () => {
    await expect(appRouter.createCaller({ ...ctx, user: null, accessToken: null }).scheduleSimulator.confirm({ id })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it("requires an active unit", async () => {
    await expect(appRouter.createCaller({ ...ctx, user: { ...ctx.user, unitId: null } }).scheduleSimulator.confirm({ id })).rejects.toThrow("Unidade");
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it("delegates the entire write to one authenticated RPC", async () => {
    m.rpc.mockResolvedValue({ data: { created: 4, alreadyConfirmed: false }, error: null });
    expect(await appRouter.createCaller(ctx).scheduleSimulator.confirm({ id, includeWarnings: false })).toEqual({ created: 4, alreadyConfirmed: false });
    expect(m.rpc).toHaveBeenCalledTimes(1);
    expect(m.rpc).toHaveBeenCalledWith("confirm_schedule_simulation", { p_id: id, p_include_warnings: false });
    expect(m.from).not.toHaveBeenCalled();
  });
  it("returns the database repeat result without another write path", async () => {
    m.rpc.mockResolvedValue({ data: { created: 0, alreadyConfirmed: true }, error: null });
    expect(await appRouter.createCaller(ctx).scheduleSimulator.confirm({ id })).toEqual({ created: 0, alreadyConfirmed: true });
    expect(m.from).not.toHaveBeenCalled();
  });
  it.each(["PGRST202", "42883"])("fails closed when RPC is unavailable (%s)", async code => {
    m.rpc.mockResolvedValue({ data: null, error: { code, message: "missing procedure" } });
    await expect(appRouter.createCaller(ctx).scheduleSimulator.confirm({ id })).rejects.toThrow("ainda não homologado");
    expect(m.from).not.toHaveBeenCalled();
  });
  it("does not report success when the database rejects a conflict", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "Conflito de horário" } });
    await expect(appRouter.createCaller(ctx).scheduleSimulator.confirm({ id })).rejects.toThrow("Conflito");
    expect(m.from).not.toHaveBeenCalled();
  });
  it("rejects an invalid RPC success response", async () => {
    m.rpc.mockResolvedValue({ data: { created: -1 }, error: null });
    await expect(appRouter.createCaller(ctx).scheduleSimulator.confirm({ id })).rejects.toThrow();
    expect(m.from).not.toHaveBeenCalled();
  });
});
