// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("public liveness security contract", () => {
  it("does not import privileged clients or enumerate users", () => {
    const source = readFileSync(new URL("./_core/healthRouter.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/import.*supabase|listUsers|process\.env|error\.message/);
    expect(source).toContain('res.status(410)');
    expect(source).toContain('"Cache-Control", "no-store"');
  });
});
