import { describe, expect, it } from "vitest";
import { listenConfig } from "./_core/listenConfig";
describe("managed hosting listener", () => {
  it("uses the hosting port on all network interfaces", () => {
    expect(listenConfig({ PORT: "8080" })).toEqual({ port: 8080, host: "0.0.0.0" });
    expect(listenConfig({})).toEqual({ port: 3000, host: "0.0.0.0" });
  });
  it.each(["", "8080oops", "-1", "0", "65536", "1.5"])("rejects invalid port %s", PORT => {
    expect(() => listenConfig({ PORT })).toThrow("PORT");
  });
});
