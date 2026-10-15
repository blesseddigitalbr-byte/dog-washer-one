import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
const state = vi.hoisted(() => ({ role: "owner", mutate: vi.fn(), pending: false, people: [] as any[] }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: state.role } }) }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({ userAccess: { list: { invalidate: vi.fn() } } }),
  userAccess: { list: { useQuery: () => ({ data: state.people, isLoading: false }) }, create: { useMutation: () => ({ mutate: state.mutate, isPending: state.pending }) } },
  workspace: { context: { useQuery: () => ({ data: { units: [{ id: "d0000000-0000-4000-8000-000000000003", name: "Lux Dog" }] } }) } },
} }));
import UserAccess from "./UserAccess";
beforeEach(() => { cleanup(); state.role = "owner"; state.pending = false; state.people = []; state.mutate.mockReset(); });
function openCreate() { fireEvent.click(screen.getByRole("button", { name: "Adicionar usuário" })); }
describe("user access form", () => {
  it("toggles password visibility without changing its value or submitting", () => {
    render(<UserAccess />);
    openCreate();
    const input = screen.getByLabelText("Senha inicial") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test-password-only!" } });
    expect(input.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(input.type).toBe("text");
    expect(input.value).toBe("Test-password-only!");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(input.type).toBe("password");
    expect(state.mutate).not.toHaveBeenCalled();
  });
  it("blocks operation staff from the form", () => {
    state.role = "staff"; render(<UserAccess />);
    expect(screen.getByText("Acesso restrito à administração.")).toBeTruthy();
    expect(screen.queryByLabelText("Senha inicial")).toBeNull();
  });
  it("only offers administrator assignment to the owner", () => {
    state.role = "admin"; render(<UserAccess />); openCreate();
    expect(within(screen.getByLabelText("Perfil")).queryByRole("option", { name: /Administrador/ })).toBeNull();
  });
  it("requires unit and acknowledgement and submits selected scope", () => {
    render(<UserAccess />);
    openCreate();
    const submit = screen.getByRole("button", { name: "Cadastrar usuário" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Teste Operação" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Senha inicial"), { target: { value: "Test-password-only!" } });
    fireEvent.click(screen.getByLabelText("Lux Dog"));
    fireEvent.click(screen.getByLabelText(/Conferi a identidade/));
    fireEvent.click(submit);
    expect(state.mutate).toHaveBeenCalledWith(expect.objectContaining({ role: "staff", verifiedEmail: true, unitIds: ["d0000000-0000-4000-8000-000000000003"], defaultUnitId: "d0000000-0000-4000-8000-000000000003" }));
  });
  it("keeps registration collapsed until requested", () => {
    render(<UserAccess />);
    expect(screen.queryByLabelText("Senha inicial")).toBeNull();
    openCreate();
    expect(screen.getByLabelText("Senha inicial")).toBeTruthy();
  });
  it("filters real returned users by normalized name, role and status", () => {
    state.people = [
      { id: "a", full_name: "Márcia", role: "owner", active: true, unit_id: "unit" },
      { id: "b", full_name: "Pedro", role: "staff", active: false, unit_id: "unit" },
    ];
    render(<UserAccess />);
    fireEvent.change(screen.getByLabelText("Buscar usuário por nome"), { target: { value: "marcia" } });
    expect(screen.getByText("Márcia")).toBeTruthy(); expect(screen.queryByText("Pedro")).toBeNull();
    fireEvent.change(screen.getByLabelText("Buscar usuário por nome"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Filtrar por perfil"), { target: { value: "staff" } });
    expect(screen.getByText("Pedro")).toBeTruthy(); expect(screen.queryByText("Márcia")).toBeNull();
    fireEvent.change(screen.getByLabelText("Filtrar por situação"), { target: { value: "active" } });
    expect(screen.getByText("Nenhum usuário encontrado para estes filtros.")).toBeTruthy();
  });
});
