import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClientForm } from "./ClientForm";
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
const mocks = vi.hoisted(() => ({ save: vi.fn(), close: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  clients: {
    create: { useMutation: () => ({ mutateAsync: mocks.save, isPending: false }) },
    update: { useMutation: () => ({ mutateAsync: mocks.save, isPending: false }) },
    uploadPhoto: { useMutation: () => ({ mutateAsync: mocks.save, isPending: false }) },
  },
  useUtils: () => ({ clients: { list: { invalidate: vi.fn() }, getById: { invalidate: vi.fn() } } }),
} }));
describe("Client editing controls", () => {
  it("preserves camel-case flags and exposes Cancel and Save", () => {
    render(<ClientForm isOpen onClose={mocks.close} clientId="client" clientData={{ name: "Tutor", email: "tutor@example.com", phone: "11999999999", isVip: true, isModelDog: true }} />);
    expect(screen.getByRole("checkbox", { name: "Cliente VIP" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("checkbox", { name: "Cliente Escola/Modelo" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(mocks.close).toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("provides an image picker with permitted formats", () => {
    render(<ClientForm isOpen onClose={() => {}} />);
    const picker = screen.getByLabelText("Foto do tutor") as HTMLInputElement;
    expect(picker.type).toBe("file");
    expect(picker.accept).toBe("image/jpeg,image/png,image/webp");
  });
});
