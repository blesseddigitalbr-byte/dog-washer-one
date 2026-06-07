import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientDetailModal } from "./ClientDetailModal";

describe("ClientDetailModal", () => {
  const mockClient = {
    id: "test-id",
    nome: "Test Client",
    email: "test@example.com",
    phone: "(11) 99999-0001",
    pets: [
      {
        id: "pet-1",
        name: "Bento",
        breed: "Poodle",
        sexo: "M",
        cor_pelagem: "Branco",
        weight: "8.5",
        is_vip: false,
        is_model_dog: false,
      },
      {
        id: "pet-2",
        name: "Mimi",
        breed: "Shih Tzu",
        sexo: "F",
        cor_pelagem: "Marrom",
        weight: "6.2",
        is_vip: true,
        is_model_dog: false,
      },
    ],
  };

  it("should render client details when isOpen is true", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={mockClient}
      />
    );

    expect(screen.queryByText("Test Client")).toBeTruthy();
    expect(screen.queryByText("test@example.com")).toBeTruthy();
    expect(screen.queryByText("(11) 99999-0001")).toBeTruthy();
  });

  it("should display all pets with their information", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={mockClient}
      />
    );

    // Check first pet
    expect(screen.queryByText("Bento")).toBeTruthy();
    expect(screen.queryByText("Poodle")).toBeTruthy();
    expect(screen.queryByText("Branco")).toBeTruthy();
    expect(screen.queryByText("8.5 kg")).toBeTruthy();

    // Check second pet
    expect(screen.queryByText("Mimi")).toBeTruthy();
    expect(screen.queryByText("Shih Tzu")).toBeTruthy();
    expect(screen.queryByText("Marrom")).toBeTruthy();
    expect(screen.queryByText("6.2 kg")).toBeTruthy();
  });

  it("should display VIP badge for VIP pets", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={mockClient}
      />
    );

    // Mimi is VIP - check for VIP badge
    const vipBadges = screen.queryAllByText(/⭐ VIP/);
    expect(vipBadges.length).toBeGreaterThan(0);
  });

  it("should display pet count", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={mockClient}
      />
    );

    expect(screen.queryByText("Pets Cadastrados (2)")).toBeTruthy();
  });

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={onClose}
        client={mockClient}
      />
    );

    const closeButtons = screen.queryAllByText("Fechar");
    if (closeButtons.length > 0) {
      closeButtons[0].click();
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("should display loading state", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={null}
        isLoading={true}
      />
    );

    // Should show dialog title
    const title = screen.queryByText("Detalhes do Cliente");
    expect(title).toBeTruthy();
  });

  it("should display error state", () => {
    const error = new Error("Failed to load client");
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={null}
        error={error}
      />
    );

    expect(screen.queryByText("Erro ao carregar detalhes")).toBeTruthy();
    expect(screen.queryByText("Failed to load client")).toBeTruthy();
  });

  it("should display empty state when client has no pets", () => {
    const clientNoPets = {
      ...mockClient,
      pets: [],
    };

    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={clientNoPets}
      />
    );

    expect(screen.queryByText("Nenhum pet cadastrado para este cliente")).toBeTruthy();
  });

  it("should convert sex abbreviations correctly", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={mockClient}
      />
    );

    expect(screen.queryByText("Macho")).toBeTruthy();
    expect(screen.queryByText("Fêmea")).toBeTruthy();
  });

  it("should render modal title", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={mockClient}
      />
    );

    expect(screen.queryByText("Detalhes do Cliente")).toBeTruthy();
  });

  it("should render action buttons", () => {
    render(
      <ClientDetailModal
        isOpen={true}
        onClose={vi.fn()}
        client={mockClient}
      />
    );

    expect(screen.queryByText("Fechar")).toBeTruthy();
    expect(screen.queryByText("Editar Cliente")).toBeTruthy();
  });
});
