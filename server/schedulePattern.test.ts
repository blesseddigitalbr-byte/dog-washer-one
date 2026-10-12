import { describe, expect, it } from "vitest";
import { applyPatternChange, suggestPatternDates, type SchedulePattern } from "../shared/schedulePattern";
const id = "11111111-1111-4111-8111-111111111111";
const pattern: SchedulePattern = { organizationId:id,unitId:id,clientId:id,petId:id,
  anchorDate:"2026-10-16",time:"14:00",intervalDays:14 };
describe("agreed recurring schedule (suggestions only)", () => {
  it("preserves Friday fortnightly appointments from the agreement", () => {
    expect(suggestPatternDates(pattern,"2026-10-17",2).map(item => item.date)).toEqual(["2026-10-30","2026-11-13"]);
  });
  it("includes the anchor day and does not generate dates before the contract", () => {
    expect(suggestPatternDates(pattern,"2026-10-01",1)[0]).toEqual({date:"2026-10-16",time:"14:00",timezone:"America/Sao_Paulo"});
  });
  it("does not turn a Tuesday exception into a new recurring preference", () => {
    const result=applyPatternChange(pattern,{scope:"one_off",date:"2026-10-20",time:"10:00"});
    expect(result.pattern).toEqual(pattern);
    expect(result.appointmentOverride).toEqual({date:"2026-10-20",time:"10:00"});
    expect(result.requiresReview).toBe(true);
  });
  it("requires review of a permanent change without mutating the original", () => {
    const result=applyPatternChange(pattern,{scope:"permanent",date:"2026-10-20",time:"10:00"});
    expect(result.pattern.anchorDate).toBe("2026-10-20");
    expect(pattern.anchorDate).toBe("2026-10-16");
    expect(result.appointmentOverride).toBeNull();
  });
  it.each(["2026-02-30","not-a-date"])("rejects invalid dates: %s", invalid => {
    expect(()=>suggestPatternDates(pattern,invalid,1)).toThrow();
  });
  it.each(["24:00","10:60"])("rejects invalid times: %s", time => {
    expect(()=>applyPatternChange(pattern,{scope:"one_off",date:"2026-10-20",time})).toThrow();
  });
  it("bounds batch size and supports year rollover", () => {
    expect(()=>suggestPatternDates(pattern,"2026-10-12",201)).toThrow();
    expect(suggestPatternDates({...pattern,anchorDate:"2026-12-25",intervalDays:7},"2026-12-25",2)[1].date).toBe("2027-01-01");
  });
});
