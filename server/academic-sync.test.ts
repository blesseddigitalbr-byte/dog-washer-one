import { describe, expect, it } from "vitest";
import { academicPracticeReferenceSchema, academicSyncState } from "../shared/academic-sync";
describe("Academic synchronization preserves portal responsibilities", () => {
  it("requires student registration even when an instructor flag arrives out of order", () => {
    expect(academicSyncState({ studentRegistered: false, instructorReviewed: true })).toBe("awaiting_student_registration");
    expect(academicSyncState({ studentRegistered: true, instructorReviewed: false })).toBe("pending_review");
    expect(academicSyncState({ studentRegistered: true, instructorReviewed: true })).toBe("reviewed");
  });
  it("does not permit a DWO reference to generate payouts or bypass student registration", () => {
    const reference = { version: 1, source: "dwo", referenceId: "d0000000-0000-4000-8000-000000000001", studentId: "d0000000-0000-4000-8000-000000000002", completedAt: "2026-10-08T15:00:00.000Z", requiresStudentRegistration: true, generatesPayout: false };
    expect(academicPracticeReferenceSchema.safeParse(reference).success).toBe(true);
    expect(academicPracticeReferenceSchema.safeParse({ ...reference, generatesPayout: true }).success).toBe(false);
    expect(academicPracticeReferenceSchema.safeParse({ ...reference, requiresStudentRegistration: false }).success).toBe(false);
  });
});
