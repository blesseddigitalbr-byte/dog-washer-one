import { describe, expect, it } from "vitest";
import { previewRetroactiveAllocation, type PendingPackageVisit, type RetroactiveContract } from "../shared/retroactivePackage";
const contract: RetroactiveContract = { id: "new", unitId: "u", clientId: "c", petId: "p", contractDate: "2026-08-17", coverageStart: "2026-08-06", expiryDate: "2027-02-06", status: "active", balanceBaths: 24, balanceGroomings: 0 };
const visit: PendingPackageVisit = { id: "v", unitId: "u", clientId: "c", petId: "p", date: "2026-08-06", status: "completed", alreadyAllocated: false, baths: 1, groomings: 0 };
describe("explicit retroactive package coverage preview", () => {
  it("covers earlier completed hygiene without consuming an avulsa grooming", () => {
    expect(previewRetroactiveAllocation(contract, [visit]).remainingBaths).toBe(23);
    expect(previewRetroactiveAllocation(contract, [visit]).remainingGroomings).toBe(0);
  });
  it.each([
    [{ alreadyAllocated: true }, "already_allocated"], [{ status: "cancelled" }, "not_completed"],
    [{ unitId: "other" }, "identity_mismatch"], [{ clientId: "other" }, "identity_mismatch"],
    [{ petId: "other" }, "identity_mismatch"], [{ date: "2026-08-05" }, "outside_coverage"],
    [{ date: "2027-02-07" }, "outside_coverage"], [{ date: "2026-02-30" }, "invalid_date"],
    [{ groomings: 1 }, "insufficient_balance"], [{ baths: -1 }, "invalid_consumption"],
  ])("rejects unsafe allocation %j", (patch, reason) => {
    const result = previewRetroactiveAllocation(contract, [{ ...visit, ...patch }]);
    expect(result.allocations[0].reason).toBe(reason); expect(result.remainingBaths).toBe(24);
  });
  it("does not allocate a combo partially", () => {
    expect(previewRetroactiveAllocation(contract, [{ ...visit, groomings: 1 }]).remainingBaths).toBe(24);
  });
  it("allocates chronological visits only while balance remains", () => {
    const result = previewRetroactiveAllocation({ ...contract, balanceBaths: 1 }, [{ ...visit, id: "later", date: "2026-08-07" }, visit]);
    expect(result.allocations.map(a => a.eligible)).toEqual([true, false]);
  });
  it("rejects duplicate selection and invalid coverage", () => {
    expect(() => previewRetroactiveAllocation(contract, [visit, visit])).toThrow("duplicado");
    expect(() => previewRetroactiveAllocation({ ...contract, coverageStart: "2026-08-18" }, [visit])).toThrow("cobertura");
  });
});
