import {describe,it,expect} from "vitest";
import {holidayName,holidayAlerts} from "../shared/holidays";
describe("holiday scheduling warnings",()=>{
  it("includes national dates without treating carnival as national",()=>{
    expect(holidayName("2026-11-20","ES")).toBe("Consciência Negra");
    expect(holidayName("2026-02-17","ES")).toBeNull();
  });
  it("scopes district holidays and moving dates to verified calendar",()=>{
    expect(holidayName("2026-11-30","DF")).toContain("Evangélico");
    expect(holidayName("2026-11-30","ES")).toBeNull();
    expect(holidayName("2026-06-04","DF")).toContain("Corpus Christi");
    expect(holidayName("2027-06-04","DF")).toBeNull();
  });
  it("uses salon date and suggests without automatically moving the appointment",()=>{
    expect(holidayAlerts("2026-10-13T02:00:00Z","DF")[0]).toContain("2026-10-13");
    expect(holidayAlerts("2026-10-13T03:00:00Z","DF")).toEqual([]);
  });
});
