import { z } from "zod";

// An operational reference is not an attendance record or an academic assessment.
export const academicPracticeReferenceSchema = z.object({
  version: z.literal(1),
  source: z.literal("dwo"),
  referenceId: z.string().uuid(),
  studentId: z.string().uuid(),
  completedAt: z.string().datetime(),
  requiresStudentRegistration: z.literal(true),
  generatesPayout: z.literal(false),
}).strict();

export type AcademicSyncState = "awaiting_student_registration" | "pending_review" | "reviewed";
export function academicSyncState(input: { studentRegistered: boolean; instructorReviewed: boolean }): AcademicSyncState {
  if (!input.studentRegistered) return "awaiting_student_registration";
  return input.instructorReviewed ? "reviewed" : "pending_review";
}
