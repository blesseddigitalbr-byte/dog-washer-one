import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), rpc: vi.fn() }));
vi.mock("../_core/supabase.js", () => ({ supabaseAdmin: {
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }) }),
  rpc: mocks.rpc,
} }));
import { registerAsaasWebhook } from "./webhook";

describe("Asaas webhook endpoint", () => {
  const token = "random-test-token-with-at-least-32-characters";
  let handler: any;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASAAS_TEST_WEBHOOK_TOKEN = token;
    registerAsaasWebhook({ post: (_path: string, callback: any) => { handler = callback; } } as any);
    mocks.lookup.mockResolvedValue({ data: { id: "12345678-1234-1234-1234-123456789012", status: "active", secret_reference: "ASAAS_TEST" }, error: null });
    mocks.rpc.mockResolvedValue({ data: { processed: true }, error: null });
  });
  const req = (secret = token) => ({ params: { accountId: "12345678-1234-1234-1234-123456789012" }, header: () => secret,
    body: { id: "evt_1", event: "PAYMENT_RECEIVED", payment: { id: "pay_1", status: "RECEIVED", value: 150, netValue: 148 } } });
  function response() { const res: any = { status: vi.fn(), json: vi.fn(), sendStatus: vi.fn() }; res.status.mockReturnValue(res); return res; }
  it("rejects unauthorized deliveries without writing records", async () => {
    const res = response(); await handler(req("incorrect"), res);
    expect(res.sendStatus).toHaveBeenCalledWith(401); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("processes an authenticated event through one atomic database operation", async () => {
    const res = response(); await handler(req(), res);
    expect(mocks.rpc).toHaveBeenCalledWith("process_asaas_payment_event", expect.objectContaining({ p_event_id: "evt_1", p_status: "received", p_net_value: 148 }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it("returns failure rather than acknowledging an unsuccessful database transaction", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "database failure" } });
    const res = response(); await handler(req(), res);
    expect(res.status).toHaveBeenCalledWith(503);
  });
  it("acknowledges duplicate deliveries without a second payment write", async () => {
    mocks.rpc.mockResolvedValue({ data: { duplicate: true }, error: null });
    const res = response(); await handler(req(), res);
    expect(res.json).toHaveBeenCalledWith({ duplicate: true });
  });
});
