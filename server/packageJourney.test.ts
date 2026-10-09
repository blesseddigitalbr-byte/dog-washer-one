import { describe, expect, it } from "vitest";
import { packageJourney } from "../shared/packageJourney";
const old = {id:"old",client_id:"c",pet_id:"p",unit_id:"u",contract_date:"2026-09-01",expiry_date:"2026-10-01",operational_status:"expired",balance_baths:1,balance_groomings:0};
const next = {...old,id:"next",contract_date:"2026-10-01",expiry_date:"2026-11-01",operational_status:"active",balance_baths:4};
describe("package current versus history", () => {
  it("archives replaced expired and consumed contracts without rewriting their status", () => {
    for (const status of ["expired","consumed"]) {
      const rows=packageJourney([{...old,operational_status:status},next],"2026-10-08");
      expect(rows[0].archived_after_replacement).toBe(true);
      expect(rows[0].operational_status).toBe(status);
      expect(rows[1].archived_after_replacement).toBe(false);
    }
  });
  it("retains attention when replacement is unavailable or belongs elsewhere", () => {
    for (const patch of [{pet_id:"other"},{client_id:"other"},{unit_id:"other"},{contract_date:"2026-11-01"},{operational_status:"cancelled"},{balance_baths:0},{expiry_date:"2026-10-02"}])
      expect(packageJourney([old,{...next,...patch}],"2026-10-08")[0].archived_after_replacement).toBe(false);
  });
});
