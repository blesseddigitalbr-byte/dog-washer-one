import { expect, it } from "vitest";
import { providerComparison } from "../../shared/provider-check";
const base = { identityMatches: true, providerStatus: "RECEIVED", localStatus: "received", providerNetCents: 401, localNetCents: 401 };
it("compares identity, settlement status and net cents independently", () => {
  expect(providerComparison(base)).toBe("matched");
  expect(providerComparison({ ...base, identityMatches: false })).toBe("identity_mismatch");
  expect(providerComparison({ ...base, providerStatus: "CONFIRMED" })).toBe("status_mismatch");
  expect(providerComparison({ ...base, providerNetCents: 400 })).toBe("net_mismatch");
  expect(providerComparison({ ...base, providerStatus: "RECEIVED_IN_CASH" })).toBe("unsupported_status");
  expect(providerComparison({ ...base, localStatus: null })).toBe("status_mismatch");
});
