// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext, CurrentUser } from "./_core/context";
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), get: vi.fn(), reset: vi.fn(), calls: [] as string[] }));
vi.mock("./_core/supabase.js", () => ({
  withTenantSupabase: (_token: string, op: () => unknown) => op(),
  supabaseAdmin: { from: mocks.from, rpc: mocks.rpc, auth: { resetPasswordForEmail: mocks.reset, admin: { getUserById: mocks.get, createUser: mocks.create, updateUserById: mocks.update, deleteUser: mocks.remove } } },
}));
import { userAccessRouter, createPlatformUserSchema } from "./userAccess";
const actor = "668700cd-b04b-4aca-baa6-6509d1fb5790", unit = "d0000000-0000-4000-8000-000000000003", org = "d0000000-0000-4000-8000-000000000001", target = "62b24bca-6a6e-40db-afd4-3448401fe9fd";
const input = { name: "Teste", email: "test@example.invalid", password: "Test-password-only!", role: "staff" as const, unitIds: [unit], defaultUnitId: unit, verifiedEmail: true as const };
function caller(role: CurrentUser["role"] | null = "owner") {
  return userAccessRouter.createCaller({ user: role ? { id: actor, email: "owner@example.invalid", name: "Owner", displayName: null, phone: null, role, organizationId: org, unitId: unit } : null, accessToken: role ? "mock" : null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}
function chain(result: any) {
  const query: any = {};
  for (const name of ["select", "eq", "in", "order", "limit", "update", "maybeSingle"]) query[name] = vi.fn(() => query);
  query.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return query;
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.calls.length = 0;
  mocks.from.mockReturnValue(chain({ data: [{ unit_id: unit, units: { is_active: true, organization_id: org } }], error: null }));
  mocks.create.mockImplementation(async () => { mocks.calls.push("create"); return { data: { user: { id: target } }, error: null }; });
  mocks.rpc.mockImplementation(async () => { mocks.calls.push("bind"); return { data: target, error: null }; });
  mocks.update.mockImplementation(async () => { mocks.calls.push("activate"); return { error: null }; });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.get.mockResolvedValue({ data: { user: { id: target, email: "saved@example.invalid" } }, error: null });
  mocks.reset.mockResolvedValue({ error: null });
});
describe("account editing and recovery", () => {
  it("identifies provider email quota without exposing raw details", async () => {
    mocks.from.mockReturnValue(chain({ data: { id: target, role: "staff" }, error: null }));
    mocks.reset.mockResolvedValue({ error: { status: 429, code: "over_email_send_rate_limit", message: "private-detail" } });
    await expect(caller().resetPassword({ id: target, confirmed: true })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS", message: expect.stringContaining("Limite de envio") });
  });
  it.each(["staff", "manager", "student"] as const)("blocks editing and reset for %s", async role => {
    await expect(caller(role).updateEmail({ id: target, email: "new@example.invalid", verifiedEmail: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(role).resetPassword({ id: target, confirmed: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it("rejects foreign or absent targets before accessing Auth", async () => {
    mocks.from.mockReturnValue(chain({ data: null, error: null }));
    await expect(caller().resetPassword({ id: target, confirmed: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.get).not.toHaveBeenCalled(); expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("does not let an admin change another admin", async () => {
    mocks.from.mockReturnValue(chain({ data: { id: target, role: "admin" }, error: null }));
    await expect(caller("admin").details({ id: target })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("updates only the email of a same-org account", async () => {
    const q = chain({ data: { id: target, role: "staff" }, error: null }); mocks.from.mockReturnValue(q);
    await caller().updateEmail({ id: target, email: "NEW@example.invalid", verifiedEmail: true });
    expect(q.eq).toHaveBeenCalledWith("organization_id", org);
    expect(mocks.update).toHaveBeenCalledWith(target, { email: "new@example.invalid", email_confirm: true });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("sends recovery only to the saved Auth email with a fixed redirect", async () => {
    mocks.from.mockReturnValue(chain({ data: { id: target, role: "staff" }, error: null }));
    expect(await caller().resetPassword({ id: target, confirmed: true })).toEqual({ requested: true });
    expect(mocks.reset).toHaveBeenCalledWith("saved@example.invalid", { redirectTo: "https://olivedrab-emu-744435.hostingersite.com/reset-password" });
  });
  it("reports email delivery errors without exposing provider details", async () => {
    mocks.from.mockReturnValue(chain({ data: { id: target, role: "staff" }, error: null }));
    mocks.reset.mockResolvedValue({ error: { message: "private-provider-detail" } });
    await expect(caller().resetPassword({ id: target, confirmed: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
describe("platform user access", () => {
  it.each([null, "staff", "manager", "student"] as const)("denies creation to %s", async role => {
    await expect(caller(role).create(input)).rejects.toMatchObject({ code: role ? "FORBIDDEN" : "UNAUTHORIZED" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("does not permit an administrator to create another administrator", async () => {
    await expect(caller("admin").create({ ...input, role: "admin" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects units outside actor scope before Auth creation", async () => {
    mocks.from.mockReturnValue(chain({ data: [], error: null }));
    await expect(caller().create(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects cross-organization unit relations", async () => {
    mocks.from.mockReturnValue(chain({ data: [{ units: { is_active: true, organization_id: "foreign" } }], error: null }));
    await expect(caller().create(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("creates a banned account, binds access, then activates without returning secrets", async () => {
    expect(await caller().create(input)).toEqual({ id: target });
    expect(mocks.calls).toEqual(["create", "bind", "activate"]);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ ban_duration: "876000h" }));
    expect(mocks.rpc).toHaveBeenCalledWith("provision_dwo_user_access", expect.objectContaining({ p_actor: actor, p_user: target, p_role: "staff" }));
    expect(mocks.update).toHaveBeenCalledWith(target, { ban_duration: "none" });
  });
  it("does not modify an existing Auth account", async () => {
    mocks.create.mockResolvedValue({ data: { user: null }, error: { message: "already exists" } });
    await expect(caller().create(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("cleans up only the new account on a binding failure", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: {} });
    await expect(caller().create(input)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(mocks.update).not.toHaveBeenCalledWith(target, { ban_duration: "none" });
    expect(mocks.remove).toHaveBeenCalledWith(target);
  });
  it("reblocks an uncertain activation failure", async () => {
    mocks.update.mockResolvedValueOnce({ error: {} }).mockResolvedValue({ error: null });
    await expect(caller().create(input)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(mocks.update).toHaveBeenLastCalledWith(target, { ban_duration: "876000h" });
    expect(mocks.remove).toHaveBeenCalledWith(target);
  });
  it("enforces minimum password, acknowledgement, role, unique units and default unit", () => {
    for (const bad of [{ password: "short" }, { verifiedEmail: false }, { role: "owner" }, { unitIds: [unit, unit] }, { defaultUnitId: target }])
      expect(createPlatformUserSchema.safeParse({ ...input, ...bad }).success).toBe(false);
  });
  it("scopes user listing to the current organization", async () => {
    const q = chain({ data: [], error: null }); mocks.from.mockReturnValue(q);
    await caller().list(); expect(q.eq).toHaveBeenCalledWith("organization_id", org);
  });
});
