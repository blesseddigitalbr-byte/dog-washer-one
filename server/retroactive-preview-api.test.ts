// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ from: vi.fn(), tenant: vi.fn(async (_jwt: string, action: () => unknown) => action()) }));
vi.mock("./_core/supabase.js", () => ({ supabase: { from: mock.from }, supabaseAdmin: { from: mock.from }, withTenantSupabase: mock.tenant }));
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
const id = "11111111-1111-4111-8111-111111111111";
const ctx: TrpcContext = { user: { id, role: "staff", email: "test@example.invalid", name: null, displayName: null, phone: null, organizationId: "org", unitId: "unit" }, accessToken: "test-jwt", req: {} as any, res: {} as any };
function chain(result: any) {
  const query: any = { then: (resolve: any) => Promise.resolve(result).then(resolve) };
  for (const method of ["select", "eq", "gte", "order", "limit", "in"]) query[method] = vi.fn(() => query);
  query.single = vi.fn(async () => result);
  return query;
}
beforeEach(() => mock.from.mockReset());
describe("read-only retroactive preview API", () => {
  it("rejects unauthenticated access without querying customer data", async () => {
    await expect(appRouter.createCaller({ ...ctx, user: null, accessToken: null }).clientPackages.retroactivePreview({ id, coverageStart: "2026-08-06" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("requires a valid date and UUID", async () => {
    await expect(appRouter.createCaller(ctx).clientPackages.retroactivePreview({ id: "wrong", coverageStart: "2026-02-30" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("scopes the contract and visits to the active unit and rejects existing consumption", async () => {
    const contract = chain({ data: { id, unit_id: "unit", client_id: "client", pet_id: "pet", contract_date: "2026-08-17", expiry_date: "2027-02-06", status: "active", balance_baths: 24, balance_groomings: 0 }, error: null });
    const appointments = chain({ data: [{ id: "visit", unit_id: "unit", client_id: "client", pet_id: "pet", appointment_date: "2026-08-07T01:00:00Z", status: "completed", include_grooming: false, client_package_id: null }], error: null });
    mock.from.mockReturnValueOnce(contract).mockReturnValueOnce(appointments).mockReturnValueOnce(chain({ data: [{ appointment_id: "visit" }], error: null }));
    const result = await appRouter.createCaller(ctx).clientPackages.retroactivePreview({ id, coverageStart: "2026-08-06" });
    expect(contract.eq).toHaveBeenCalledWith("unit_id", "unit");
    expect(appointments.eq).toHaveBeenCalledWith("unit_id", "unit");
    expect(appointments.eq).toHaveBeenCalledWith("client_id", "client");
    expect(appointments.eq).toHaveBeenCalledWith("pet_id", "pet");
    expect(result.visits[0].date).toBe("2026-08-06");
    expect(result.allocations[0].reason).toBe("already_allocated");
    expect(result.remainingBaths).toBe(24); expect(result.readOnly).toBe(true);
  });
  it("fails closed when the consumption lookup fails", async () => {
    mock.from.mockReturnValueOnce(chain({ data: { id, unit_id: "unit", client_id: "c", pet_id: "p" }, error: null }))
      .mockReturnValueOnce(chain({ data: [{ id: "visit" }], error: null }))
      .mockReturnValueOnce(chain({ data: null, error: { message: "unavailable" } }));
    await expect(appRouter.createCaller(ctx).clientPackages.retroactivePreview({ id, coverageStart: "2026-08-06" })).rejects.toThrow("conferir os consumos");
  });
});
