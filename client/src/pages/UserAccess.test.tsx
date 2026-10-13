import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const state = vi.hoisted(() => ({ role: "owner", mutate: vi.fn(), pending: false }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: state.role } }) }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({ userAccess: { list: { invalidate: vi.fn() } } }),
  userAccess: { list: { useQuery: () => ({ data: [], isLoading: false }) }, create: { useMutation: () => ({ mutate: state.mutate, isPending: state.pending }) } },
  workspace: { context: { useQuery: () => ({ data: { units: [{ id: "d0000000-0000-4000-8000-000000000003", name: "Lux Dog" }] } }) } },
} }));
import UserAccess from "./UserAccess";
beforeEach(() => { cleanup(); state.role = "owner"; state.pending = false; state.mutate.mockReset(); });
describe("user access form", () => {
  it("toggles password visibility without changing its value or submitting", () => {
    render(<UserAccess />);
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
    state.role = "admin"; render(<UserAccess />);
    expect(screen.queryByRole("option", { name: /Administrador/ })).toBeNull();
  });
  it("requires unit and acknowledgement and submits selected scope", () => {
    render(<UserAccess />);
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
});
