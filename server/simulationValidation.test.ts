import { describe, expect, it } from "vitest";
import { validateSimulationSelection as validate } from "../shared/simulationValidation";
const item = {scheduled_at:"2026-10-09T12:00:00Z",include_grooming:false};
const pkg = {status:"active",contract_date:"2026-10-09",expiry_date:"2026-10-10",balance_baths:2,balance_groomings:0};
describe("simulation confirmation revalidation", () => {
  it("hygiene uses bath only; explicit grooming requires an additional credit", () => {
    expect(() => validate([item],60,pkg)).not.toThrow();
    expect(() => validate([{...item,include_grooming:true}],60,pkg)).toThrow(/saldo/);
  });
  it("rejects internally overlapping or already published dates", () => {
    expect(() => validate([item,item],60)).toThrow(/sobreposição/);
    expect(() => validate([{...item,appointment_id:"existing"}],60)).toThrow(/já foi incluída/);
    expect(() => validate([item,{...item,scheduled_at:"2026-10-09T13:00:00Z"}],60,pkg)).not.toThrow();
  });
  it("uses salon dates for inclusive validity and rejects future or expired contracts", () => {
    expect(() => validate([{...item,scheduled_at:"2026-10-11T02:59:00Z"}],60,pkg)).not.toThrow();
    expect(() => validate([{...item,scheduled_at:"2026-10-11T03:00:00Z"}],60,pkg)).toThrow(/vigência/);
    expect(() => validate([item],60,{...pkg,contract_date:"2026-10-10"})).toThrow(/vigência/);
  });
  it("rejects invalid duration, dates, inactive contracts and bath insufficiency", () => {
    expect(() => validate([item],0)).toThrow(/Duração/);
    expect(() => validate([{...item,scheduled_at:"bad"}],60)).toThrow(/Data/);
    expect(() => validate([item],60,{...pkg,status:"cancelled"})).toThrow(/ativo/);
    expect(() => validate([item],60,{...pkg,balance_baths:0})).toThrow(/saldo/);
  });
});
