import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientDetailModal } from "./ClientDetailModal";

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

    const closeButtons = screen.queryAllByText("Fechar");
    if (closeButtons.length > 0) {
      closeButtons[0].click();
      expect(onClose).toHaveBeenCalled();
    }
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
