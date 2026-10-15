// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ from: vi.fn(), storage: vi.fn(), sign: vi.fn() }));
vi.mock("./_core/supabase.js", () => ({ supabase: { from: mock.from }, supabaseAdmin: { storage: { from: mock.storage } }, withTenantSupabase: (_token: string, fn: () => unknown) => fn() }));
import { appRouter } from "./routers";
const id = "11111111-1111-4111-8111-111111111111";
const ctx: any = { user: { id, role: "staff", organizationId: "org", unitId: "unit" }, accessToken: "test", req: {}, res: {} };
function record(key: string) {
  const q: any = {};
  for (const method of ["select", "eq", "limit"]) q[method] = () => q;
  q.then = (resolve: any) => Promise.resolve({ data: [{ id, organization_id: "org", nome: "Test", pets: [{ id, organization_id: "org", name: "Test pet", photo_storage_key: key, photo: "obsolete-url" }] }], error: null }).then(resolve);
  mock.from.mockReturnValue(q);
}
beforeEach(() => { vi.clearAllMocks(); mock.storage.mockReturnValue({ createSignedUrl: mock.sign }); mock.sign.mockResolvedValue({ data: { signedUrl: "https://example.invalid/valid-signed" }, error: null }); });
describe("API refuses forged photo references before privileged signing", () => {
  it.each([`other-org/pets/${id}/a.png`, "org/pets/other-record/a.png"])("does not sign %s", async key => {
    record(key);
    const result = await appRouter.createCaller(ctx).clients.getById({ id });
    expect(mock.storage).not.toHaveBeenCalled();
    expect(result!.pets[0].photo).toBeNull();
    expect(result!.pets[0]).not.toHaveProperty("photo_storage_key");
  });
  it("signs the owned object and omits the raw key", async () => {
    const key = `org/pets/${id}/a.png`; record(key);
    const result = await appRouter.createCaller(ctx).clients.getById({ id });
    expect(mock.sign).toHaveBeenCalledWith(key, 3600);
    expect(result!.pets[0].photo).toBe("https://example.invalid/valid-signed");
    expect(result!.pets[0]).not.toHaveProperty("photo_storage_key");
  });
  it("does not fall back to stale private URLs when signing fails", async () => {
    record(`org/pets/${id}/a.png`);
    mock.sign.mockResolvedValue({ data: null, error: { message: "unavailable" } });
    const result = await appRouter.createCaller(ctx).clients.getById({ id });
    expect(result!.pets[0].photo).toBeNull();
  });
});
