import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const signIn = vi.hoisted(() => vi.fn());
const reset = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { signInWithPassword: signIn, resetPasswordForEmail: reset } } }));
import Login from "./Login";
afterEach(()=>{cleanup();vi.clearAllMocks();});
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
it("requests recovery without a password and never redirects to localhost",async()=>{
 reset.mockResolvedValue({error:null});render(<Login/>);
 fireEvent.change(screen.getByLabelText("E-mail"),{target:{value:"TEST@example.invalid"}});
 fireEvent.click(screen.getByRole("button",{name:"Esqueci minha senha"}));
 expect(screen.queryByLabelText("Senha")).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Enviar link de recuperação"}));
 await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("Se este email estiver cadastrado"));
 expect(reset).toHaveBeenCalledWith("test@example.invalid",{redirectTo:"https://olivedrab-emu-744435.hostingersite.com/reset-password"});
 expect(signIn).not.toHaveBeenCalled();
 expect(screen.getByRole("button",{name:"Aguarde antes de reenviar"}).hasAttribute("disabled")).toBe(true);
});
it("reports quota errors without exposing provider details",async()=>{
 reset.mockResolvedValue({error:{status:429,message:"private-detail"}});render(<Login/>);
 fireEvent.change(screen.getByLabelText("E-mail"),{target:{value:"test@example.invalid"}});
 fireEvent.click(screen.getByRole("button",{name:"Esqueci minha senha"}));
 fireEvent.click(screen.getByRole("button",{name:"Enviar link de recuperação"}));
 await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("Limite de envio"));
 expect(screen.queryByText(/private-detail/)).toBeNull();
});
it("recovers from network failure and lets the user return to login",async()=>{
 reset.mockRejectedValue(new Error("private"));render(<Login/>);
 fireEvent.change(screen.getByLabelText("E-mail"),{target:{value:"test@example.invalid"}});
 fireEvent.click(screen.getByRole("button",{name:"Esqueci minha senha"}));
 fireEvent.click(screen.getByRole("button",{name:"Enviar link de recuperação"}));
 await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("Não foi possível conectar"));
 fireEvent.click(screen.getByRole("button",{name:"Voltar para entrar"}));
 expect(screen.getByLabelText("Senha")).toBeTruthy();
 expect(screen.getByRole("button",{name:"Entrar"}).hasAttribute("disabled")).toBe(false);
});
