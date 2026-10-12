// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ from: vi.fn(), storage: vi.fn(), tenant: vi.fn(async (_token: string, op: () => unknown) => op()) }));
vi.mock("./_core/supabase.js", () => ({ supabase: { from: m.from }, supabaseAdmin: { storage: { from: m.storage } }, withTenantSupabase: m.tenant }));
import { appRouter } from "./routers";
const id = "11111111-1111-4111-8111-111111111111";
const ctx: any = { user: { id, role: "staff", organizationId: "org", unitId: "unit" }, accessToken: "fake-jwt", req: {}, res: {} };
const input = { petId: id, base64: "dGVzdA==", fileName: "pet.png", mimeType: "image/png" };
beforeEach(() => { m.from.mockReset(); m.storage.mockReset(); });
function pet(data: any) { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data, error: null }) }; return q; }
describe("pet photo upload API safety with isolated storage", () => {
  it("rejects anonymous upload before storage or database access", async () => {
    await expect(appRouter.createCaller({ ...ctx, user: null, accessToken: null }).pets.uploadPhoto(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(m.from).not.toHaveBeenCalled(); expect(m.storage).not.toHaveBeenCalled();
  });
  it("rejects a pet invisible to the authenticated tenant", async () => {
    m.from.mockReturnValue(pet(null));
    await expect(appRouter.createCaller(ctx).pets.uploadPhoto(input)).rejects.toThrow("Pet não encontrado");
    expect(m.storage).not.toHaveBeenCalled();
  });
  it.each(["image/svg+xml", "text/html", "application/pdf"])("rejects forbidden MIME %s", async mimeType => {
    m.from.mockReturnValue(pet({ id }));
    await expect(appRouter.createCaller(ctx).pets.uploadPhoto({ ...input, mimeType })).rejects.toThrow("Formato");
    expect(m.storage).not.toHaveBeenCalled();
  });
  it("rejects empty image content", async () => {
    m.from.mockReturnValue(pet({ id }));
    await expect(appRouter.createCaller(ctx).pets.uploadPhoto({ ...input, base64: "" })).rejects.toThrow("5 MB");
    expect(m.storage).not.toHaveBeenCalled();
  });
  it("rejects HTML disguised as a PNG before storage", async () => {
    m.from.mockReturnValue(pet({ id }));
    await expect(appRouter.createCaller(ctx).pets.uploadPhoto({ ...input, base64: Buffer.from("<script>alert(1)</script>").toString("base64") })).rejects.toThrow("incompatível");
    expect(m.storage).not.toHaveBeenCalled();
  });
  it("rejects oversized encoded input before database access", async () => {
    await expect(appRouter.createCaller(ctx).pets.uploadPhoto({ ...input, base64: "A".repeat(7 * 1024 * 1024 + 1) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(m.from).not.toHaveBeenCalled(); expect(m.storage).not.toHaveBeenCalled();
  });
  it("removes uploaded object when signed URL creation fails", async () => {
    m.from.mockReturnValue(pet({ id }));
    const remove = vi.fn(async () => ({ error: null }));
    m.storage.mockReturnValue({ upload: vi.fn(async () => ({ error: null })), createSignedUrl: vi.fn(async () => ({ data: null, error: new Error("signed URL failure") })), remove });
    await expect(appRouter.createCaller(ctx).pets.uploadPhoto({ ...input, base64: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString("base64") })).rejects.toThrow("signed URL failure");
    expect(remove).toHaveBeenCalledOnce();
  });
});
