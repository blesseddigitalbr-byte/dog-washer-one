import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({
  result: {} as any,
  create: vi.fn(),
  move: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    purchases: {
      documents: { useQuery: () => ({ data: { rows: [], total: 0 } }) },
    },
    supplies: {
      list: { useQuery: () => mocks.result },
      history: {
        useQuery: () => ({ data: { rows: [], total: 0 }, refetch: vi.fn() }),
      },
      create: {
        useMutation: () => ({ mutate: mocks.create, isPending: false }),
      },
      move: { useMutation: () => ({ mutate: mocks.move, isPending: false }) },
      update: {
        useMutation: () => ({ mutate: mocks.update, isPending: false }),
      },
    },
  },
}));
import Products from "./Products";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.result = {
    data: { rows: [], total: 0 },
    isLoading: false,
    refetch: vi.fn(),
  };
});
it("shows an empty real inventory without inventing opening stock", () => {
  render(<Products />);
  expect(
    screen.getByText("Nenhum insumo cadastrado nesta unidade.")
  ).toBeTruthy();
  expect(screen.queryByText("Abaixo do estoque mínimo")).toBeNull();
});
it("creates only a catalogue item, not an arbitrary balance", () => {
  render(<Products />);
  fireEvent.click(screen.getByText("Cadastrar insumo"));
  fireEvent.change(screen.getByLabelText("Nome do insumo"), {
    target: { value: "Shampoo" },
  });
  fireEvent.change(screen.getByLabelText("Código interno"), {
    target: { value: "SHAMPOO-01" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Cadastrar com estoque zero" })
  );
  expect(mocks.create).toHaveBeenCalledWith({
    name: "Shampoo",
    sku: "SHAMPOO-01",
    measure: "un",
    minimumStock: 0,
  });
});
it("shows the low stock warning and submits consumption without purchase cost", () => {
  mocks.result.data = {
    total: 1,
    rows: [
      {
        id: "product",
        name: "Shampoo",
        sku: "SHAMPOO-01",
        measure: "ml",
        minimum_stock: 2,
        stock: 1,
        version: 0,
        is_active: true,
        updated_at: "2026-10-14T00:00:00Z",
      },
    ],
  };
  render(<Products />);
  expect(screen.getByText("Abaixo do estoque mínimo")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Movimento"), {
    target: { value: "consumption" },
  });
  expect(screen.queryByLabelText("Custo total desta entrada (R$)")).toBeNull();
  fireEvent.change(screen.getByLabelText("Quantidade (ml)"), {
    target: { value: "0.25" },
  });
  fireEvent.change(screen.getByLabelText("Motivo / referência"), {
    target: { value: "Uso no salão" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Registrar movimento" }));
  expect(mocks.move).toHaveBeenCalledWith({
    id: "product",
    version: 0,
    requestId: expect.any(String),
    kind: "consumption",
    quantity: 0.25,
    purchaseCostCents: undefined,
    reason: "Uso no salão",
  });
});
it("does not show an empty success on API failure", () => {
  mocks.result = {
    error: { message: "Estoque indisponível" },
    isLoading: false,
  };
  render(<Products />);
  expect(screen.getByRole("alert").textContent).toBe("Estoque indisponível");
  expect(
    screen.queryByText("Nenhum insumo cadastrado nesta unidade.")
  ).toBeNull();
});
