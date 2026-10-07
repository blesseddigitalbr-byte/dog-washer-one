import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientDetailModal } from "./ClientDetailModal";

vi.mock("@/lib/trpc", () => ({ trpc: {
  visits: { byPet: { useQuery: () => ({ data: [] }) } },
  pets: { delete: { useMutation: () => ({ mutateAsync: vi.fn() }) } },
  clients: { getById: { useQuery: () => ({ data: null, isLoading: false, error: null }) } },
  useUtils: () => ({ clients: { getById: { invalidate: vi.fn() } } }),
} }));

describe("ClientDetailModal", () => {
  it("should render modal title when isOpen is true", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        clientId="test-id"
      />
    );

    expect(screen.queryByText("Detalhes do Cliente")).toBeTruthy();
  });

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={onClose}
        clientId="test-id"
      />
    );

    screen.getByRole("button", { name: "Fechar detalhes do cliente" }).click();
    expect(onClose).toHaveBeenCalled();
  });

  it("should not render when isOpen is false", () => {
    render(
      <ClientDetailModal
        isOpen={false}
        onClose={vi.fn()}
        clientId="test-id"
      />
    );

    expect(screen.queryByText("Detalhes do Cliente")).toBeFalsy();
  });
});
