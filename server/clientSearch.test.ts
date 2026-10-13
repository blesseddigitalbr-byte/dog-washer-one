import { describe, expect, it } from "vitest";
import { matchesClientSearch } from "../shared/clientSearch";

describe("client search", () => {
  const client = { name: "João Silva", pets: [{ name: "Pet Homologação DWO" }] };
  it("matches tutor, accents, case and multiple words", () => {
    expect(matchesClientSearch(client, " JOAO silva ", 1, 2)).toBe(true);
  });
  it("matches pet and displayed codes", () => {
    for (const query of ["homologacao", "CLI-0002", "PET-0003"])
      expect(matchesClientSearch(client, query, 1, 2)).toBe(true);
  });
  it("does not match unrelated records or codes", () => {
    expect(matchesClientSearch(client, "TESTE QA", 1, 2)).toBe(false);
    expect(matchesClientSearch(client, "CLI-0001", 1, 2)).toBe(false);
  });
  it("allows empty query and clients without pets", () => {
    expect(matchesClientSearch({ name: "Ana" }, "", 0, 0)).toBe(true);
    expect(matchesClientSearch({ name: "Ana" }, "pet", 0, 0)).toBe(false);
  });
});
