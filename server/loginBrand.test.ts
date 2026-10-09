import { describe, expect, it } from "vitest";
import { loginBrand } from "../shared/loginBrand";
describe("public login identity", () => {
  it("personalizes only the exact Lux Dog hostname", () => {
    expect(loginBrand("app.luxdog.com.br").lux).toBe(true);
    expect(loginBrand("APP.LUXDOG.COM.BR").logo).toBe("/brand/lux-dog.png");
    expect(loginBrand("app.luxdog.com.br.attacker.test").lux).toBe(false);
  });
  it("keeps DWO for the platform and previews", () => {
    for (const host of ["app.dogwasher.com.br", "dog-washer-one.vercel.app", "localhost"])
      expect(loginBrand(host).logo).toBe("/brand/dwo-horizontal.png");
  });
});
