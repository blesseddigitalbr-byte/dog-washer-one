import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({
  suppliers: {} as any,
  documents: {} as any,
  create: vi.fn(),
  invoice: vi.fn(),
  payment: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    purchases: {
      suppliers: { useQuery: () => mocks.suppliers },
      documents: { useQuery: () => mocks.documents },
      payments: {
        useQuery: () => ({ data: { rows: [], total: 0 }, refetch: vi.fn() }),
      },
      createSupplier: {
        useMutation: () => ({ mutate: mocks.create, isPending: false }),
      },
      createDocument: {
        useMutation: () => ({ mutate: mocks.invoice, isPending: false }),
      },
      recordPayment: {
        useMutation: () => ({ mutate: mocks.payment, isPending: false }),
      },
      updateSupplier: {
        useMutation: () => ({ mutate: mocks.update, isPending: false }),
      },
    },
  },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/purchases", vi.fn()] }));
import Purchases from "./Purchases";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.suppliers = { data: { rows: [], total: 0 }, refetch: vi.fn() };
  mocks.documents = { data: { rows: [], total: 0 }, refetch: vi.fn() };
});
it("does not invent suppliers, invoices or payments", () => {
  render(<Purchases />);
  expect(screen.getByText("Nenhum fornecedor cadastrado.")).toBeTruthy();
  expect(
    screen.getByText("Nenhuma nota encontrada nesta unidade.")
  ).toBeTruthy();
  expect(mocks.payment).not.toHaveBeenCalled();
});
it("registers a supplier without banking side effects", () => {
  render(<Purchases />);
  fireEvent.click(
    screen.getByText("Cadastrar fornecedor", { selector: "summary" })
  );
  fireEvent.change(screen.getByLabelText("Razão social / nome"), {
    target: { value: "Fornecedor Teste" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Cadastrar fornecedor" }));
  expect(mocks.create).toHaveBeenCalledWith({
    name: "Fornecedor Teste",
    document: "",
    email: "",
    phone: "",
  });
  expect(mocks.payment).not.toHaveBeenCalled();
});
it("separates invoice amount, payments and stock costs", () => {
  mocks.documents.data = {
    total: 1,
    rows: [
      {
        id: "invoice",
        supplier_name: "Fornecedor Teste",
        supplier_id: "supplier",
        number: "123",
        series: "1",
        issue_date: "2026-10-14",
        total_cents: 10000,
        paid_cents: 2500,
        entries_cost_cents: 8000,
      },
    ],
  };
  render(<Purchases />);
  expect(screen.getByText(/Pago informado:/).textContent).toContain("25,00");
  expect(screen.getByText(/Custo já vinculado/).textContent).toContain("80,00");
  expect(mocks.payment).not.toHaveBeenCalled();
});
