import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ update: vi.fn(), signOut: vi.fn(), session: true }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: {
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  getSession: async () => ({ data: { session: mocks.session ? {} : null } }),
  updateUser: mocks.update, signOut: mocks.signOut,
} } }));
import ResetPassword from "./ResetPassword";
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.session = true; });
it("does not offer password changes without a session", async () => {
  mocks.session = false; render(<ResetPassword />);
  expect(screen.queryByLabelText("Nova senha")).toBeNull();
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects mismatched passwords and clears the form after success", async () => {
  mocks.update.mockResolvedValue({ error: null }); mocks.signOut.mockResolvedValue({});
  render(<ResetPassword />);
  await waitFor(() => expect(screen.getByLabelText("Nova senha")).toBeTruthy());
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "Test-password-only!" } });
  fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "different-password!" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
  expect(mocks.update).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "Test-password-only!" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
  await waitFor(() => expect(mocks.signOut).toHaveBeenCalled());
  expect(mocks.update).toHaveBeenCalledWith({ password: "Test-password-only!" });
  expect(screen.queryByLabelText("Nova senha")).toBeNull();
});
