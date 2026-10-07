import { describe, expect, it } from "vitest";
import { brandingSchema, neutralBrand, brandSignature, commercialModules } from "../shared/branding";
describe("White-label configuration", () => {
  it("accepts validated colors and both endorsement modes", () => {
    expect(brandingSchema.safeParse(neutralBrand).success).toBe(true);
    expect(brandSignature("by")).toBe("by Dog Washer");
    expect(brandSignature("network")).toBe("Um salão Dog Washer");
  });
  it("rejects CSS injection and missing brand names", () => {
    expect(brandingSchema.safeParse({ ...neutralBrand, primary_color: "red; display:none" }).success).toBe(false);
    expect(brandingSchema.safeParse({ ...neutralBrand, display_name: " " }).success).toBe(false);
  });
  it("includes partner finance as a distinct commercial module", () => {
    expect(commercialModules.some(module => module.id === "partners")).toBe(true);
  });
});
