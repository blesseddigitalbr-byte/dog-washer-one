import { describe, expect, it } from "vitest";
import { invoiceCsv } from "../../shared/invoice-export";
describe("accounting CSV", () => {
  it("preserves accents, identifiers, delimiters and quotes", () => {
    expect(invoiceCsv([["Descrição", 'a;"b', "00123", null]])).toBe('\uFEFF"Descrição";"a;""b";"00123";""');
  });
  it("neutralizes formulas including leading whitespace", () => {
    expect(invoiceCsv([["=CMD()", " @SUM(1)", "+2", "-1"]])).toBe('\uFEFF"\'=CMD()";"\' @SUM(1)";"\'+2";"\'-1"');
  });
});
