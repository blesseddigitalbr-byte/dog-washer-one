import { expect, it } from "vitest";
import { previewInventoryMovement as preview } from "../shared/consumableInventory";
it("tracks internal purchases and consumption", () => {
  expect(preview(2, {kind:"purchase",quantity:3,unitCostCents:100})).toEqual({balance:5,purchaseCostCents:300});
  expect(preview(5, {kind:"consumption",quantity:0.5})).toEqual({balance:4.5,purchaseCostCents:null});
});
it("rejects negative stock and invalid quantities/cost", () => {
  expect(() => preview(1, {kind:"loss",quantity:2})).toThrow("Estoque insuficiente");
  expect(() => preview(1, {kind:"consumption",quantity:NaN})).toThrow();
  expect(() => preview(1, {kind:"purchase",quantity:1,unitCostCents:-1})).toThrow();
});
