// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
const isolated = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), tenant: vi.fn(async (_jwt: string, action: () => unknown) => action()) }));
vi.mock("./_core/supabase.js", () => ({ supabase: isolated, supabaseAdmin: isolated, withTenantSupabase: isolated.tenant }));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
const id = "11111111-1111-4111-8111-111111111111";
const ctx: TrpcContext = { user: { id, role: "staff", email: "test@example.invalid", name: null, displayName: null, phone: null, organizationId: "org", unitId: "unit" }, accessToken: "fake-jwt", req: {} as any, res: {} as any };
function chain(result: any) {
  const q: any = {};
  for (const method of ["select", "eq", "update"]) q[method] = vi.fn(() => q);
  q.single = vi.fn(async () => result); return q;
}
beforeEach(() => { isolated.from.mockReset(); isolated.rpc.mockReset(); });
describe("appointment lifecycle API with isolated database", () => {
  it("rejects anonymous listing before database access", async () => {
    await expect(appRouter.createCaller({ ...ctx, user: null, accessToken: null }).appointments.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(isolated.from).not.toHaveBeenCalled();
  });
  it("delegates completed execution to the atomic procedure", async () => {
    const q = chain({ data: { id, status: "in_progress" }, error: null });
    isolated.from.mockReturnValue(q); isolated.rpc.mockResolvedValue({ data: { id, status: "completed" }, error: null });
    const result = await appRouter.createCaller(ctx).appointments.setStatus({ id, status: "completed" });
    expect(q.eq).toHaveBeenCalledWith("unit_id", "unit");
    expect(isolated.rpc).toHaveBeenCalledWith("complete_appointment", { p_appointment_id: id });
    expect(result.status).toBe("completed"); expect(q.update).not.toHaveBeenCalled();
  });
  it("surfaces atomic failure", async () => {
    isolated.from.mockReturnValue(chain({ data: { id, status: "in_progress" }, error: null }));
    isolated.rpc.mockResolvedValue({ data: null, error: { message: "Saldo insuficiente" } });
    await expect(appRouter.createCaller(ctx).appointments.setStatus({ id, status: "completed" })).rejects.toThrow("Saldo insuficiente");
  });
  it.each(["pending", "confirmed", "cancelled", "no_show"])("prevents completion from %s", async status => {
    isolated.from.mockReturnValue(chain({ data: { id, status }, error: null }));
    await expect(appRouter.createCaller(ctx).appointments.setStatus({ id, status: "completed" })).rejects.toThrow("Mudança de status");
    expect(isolated.rpc).not.toHaveBeenCalled();
  });
  it("fails on missing appointment", async () => {
    isolated.from.mockReturnValue(chain({ data: null, error: null }));
    await expect(appRouter.createCaller(ctx).appointments.setStatus({ id, status: "completed" })).rejects.toThrow("não encontrado");
    expect(isolated.rpc).not.toHaveBeenCalled();
  });
  it("requires cancellation reason and uses atomic cancellation", async () => {
    await expect(appRouter.createCaller(ctx).appointments.setStatus({ id, status: "cancelled" })).rejects.toThrow("motivo");
    isolated.rpc.mockResolvedValue({ data: { id, status: "cancelled" }, error: null });
    await appRouter.createCaller(ctx).appointments.setStatus({ id, status: "cancelled", reason: "Solicitado pelo tutor" });
    expect(isolated.rpc).toHaveBeenCalledWith("cancel_appointment", { p_id: id, p_reason: "Solicitado pelo tutor" });
    expect(isolated.from).not.toHaveBeenCalled();
  });
});
