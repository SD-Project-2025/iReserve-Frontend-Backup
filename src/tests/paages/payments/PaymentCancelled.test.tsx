//@ts-ignore
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest"; // or use 'jest' if you're using Jest directly
import PaymentCancelled from "@/pages/payments/PaymentCancelled";
import { useNavigate, useParams } from "react-router-dom";

// Mock react-router hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
  };
});

describe("PaymentCancelled Component", () => {
  const mockNavigate = vi.fn();
  const mockUseParams = vi.fn();

  beforeEach(() => {
    (useNavigate as jest.Mock).mockImplementation(() => mockNavigate);
    (useParams as jest.Mock).mockImplementation(() =>
      mockUseParams({ id: "123" })
    );
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders payment cancelled page with correct content", () => {
    mockUseParams({ id: "456" });
    render(<PaymentCancelled />);
    
    expect(screen.getByText(/Payment Cancelled/i)).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to event page in 10 seconds/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Return to Event Now/i })).toBeInTheDocument();
    expect(screen.getByTestId("cancel-icon")).toBeInTheDocument(); // Optional: Add data-testid to icon
  });

  test("manual return button navigates immediately", () => {
    mockUseParams({ id: "789" });
    render(<PaymentCancelled />);
    
    fireEvent.click(screen.getByRole("button", { name: /Return to Event Now/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/events/789");
  });

  test("auto-redirects after 10 seconds", async () => {
    mockUseParams({ id: "123" });
    render(<PaymentCancelled />);
    
    // Fast-forward time by 10 seconds
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/events/123");
    });
  });

  test("updates countdown every second", () => {
    mockUseParams({ id: "123" });
    render(<PaymentCancelled />);
    
    // Initial countdown
    expect(screen.getByText(/in 10 seconds/i)).toBeInTheDocument();

    // Advance 3 seconds
    vi.advanceTimersByTime(3000);
    expect(screen.getByText(/in 7 seconds/i)).toBeInTheDocument();

    // Advance full 10 seconds
    vi.advanceTimersByTime(7000);
    expect(screen.getByText(/in 0 seconds/i)).toBeInTheDocument();
  });

  test("cleans up timer and interval on unmount", () => {
    mockUseParams({ id: "456" });
    const { unmount } = render(<PaymentCancelled />);
    
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});