import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import FinancialSummary from "./FinancialSummary";
afterEach(cleanup);
it("distinguishes received and confirmed amounts and states the dataset limit", () => {
  render(<FinancialSummary loading={false} rows={[{id:"received-row",grossCents:10000,netCents:9800,paymentStatus:"received"},{id:"confirmed-row",grossCents:20000,netCents:null,paymentStatus:"confirmed"}]} />);
  expect(screen.getByText("Recebido · bruto")).toBeTruthy();
  expect(screen.getByText("Confirmado · aguardando disponibilidade")).toBeTruthy();
  expect(screen.getByText(/até 100 cobranças/)).toBeTruthy();
  expect(screen.getByText("Não informado")).toBeTruthy();
});
it("does not present unavailable data as zero", () => {
  render(<FinancialSummary loading={false} error="Indisponível" />);
  expect(screen.getByRole("alert").textContent).toBe("Indisponível");
  expect(screen.getAllByText("—")).toHaveLength(4);
});
