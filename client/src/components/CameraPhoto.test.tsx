import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CameraPhoto } from "./CameraPhoto";

describe("Camera photo", () => {
  it("requests video only after clicking and stops tracks on close", async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    render(<CameraPhoto onCapture={vi.fn()} />);
    expect(getUserMedia).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tirar foto com câmera" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Fechar câmera" })).toBeTruthy());
    expect(getUserMedia.mock.calls[0][0].audio).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Fechar câmera" }));
    expect(stop).toHaveBeenCalledOnce();
  });
  it("shows an actionable message when permission is denied", async () => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<CameraPhoto onCapture={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Tirar foto com câmera" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("use o upload"));
  });
});
