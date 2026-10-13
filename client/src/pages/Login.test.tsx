import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const signIn = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { signInWithPassword: signIn } } }));
import Login from "./Login";
afterEach(cleanup);
it("shows and hides the login password without signing in", () => {
  render(<Login />);
  const input = screen.getByLabelText("Senha") as HTMLInputElement;
  fireEvent.change(input, { target: { value: "Test-password-only!" } });
  expect(input.type).toBe("password");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect(input.type).toBe("text");
  expect(input.value).toBe("Test-password-only!");
  fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect(input.type).toBe("password");
  expect(signIn).not.toHaveBeenCalled();
});
