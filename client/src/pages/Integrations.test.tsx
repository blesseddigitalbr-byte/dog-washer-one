import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
const state = vi.hoisted(() => ({ role: "owner", data: { accounts: [] as any[], payments: [] as any[], events: [] as any[] }, error: null as any }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: state.role } }) }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  asaas: { overview: { useQuery: () => ({ data: state.error ? undefined : state.data, error: state.error, refetch: vi.fn(), isFetching: false, isLoading: false }) } },
  workspace: { context: { useQuery: () => ({ data: { organization: { name: "Lux Dog" }, currentUnit: { name: "Principal" } } }) } },
} }));
import Integrations from "./Integrations";
beforeEach(() => { cleanup(); state.role = "owner"; state.data = { accounts: [], payments: [], events: [] }; state.error = null; });
describe("integration overview keeps status evidence separate from configuration", () => {
  it("shows channel cards and current organization without claiming connection", () => {
    render(<Integrations />);
    for (const name of ["Email transacional", "WhatsApp", "SMS", "Agenda do cliente", "Atendimento com IA"]) expect(screen.getByText(name)).toBeTruthy();
    expect(screen.getByText("Nenhuma conta cadastrada")).toBeTruthy();
    expect(screen.queryByText("Conectado")).toBeNull();
    expect(screen.getByText(/Organização: Lux Dog/)).toBeTruthy();
  });
  it("labels a sandbox account as a registration, not production homologation", () => {
    state.data.accounts = [{ id: "test", status: "active", environment: "sandbox" }];
    render(<Integrations />);
    expect(screen.getByText("Conta ativa no cadastro")).toBeTruthy();
    expect(screen.getByText("Há conta em ambiente de testes (sandbox).")).toBeTruthy();
  });
  it("does not turn a query failure into a false empty state", () => {
    state.error = { message: "Consulta indisponível" }; render(<Integrations />);
    expect(screen.getByRole("alert").textContent).toBe("Consulta indisponível");
    expect(screen.queryByText("Nenhuma conta cadastrada")).toBeNull();
  });
  it("does not expose the administrative overview to operation", () => {
    state.role = "staff"; render(<Integrations />);
    expect(screen.getByText("Acesso restrito à administração.")).toBeTruthy();
    expect(screen.queryByText("Email transacional")).toBeNull();
  });
});
