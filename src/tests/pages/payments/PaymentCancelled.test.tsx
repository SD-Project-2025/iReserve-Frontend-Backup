// Updated Test File
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PaymentCancelled from "@/pages/payments/PaymentCancelled";
import { useNavigate, useParams } from "react-router-dom";


jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

describe("PaymentCancelled Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ id: "123" });
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders payment cancelled page with correct content", () => {
    (useParams as jest.Mock).mockReturnValue({ id: "456" });
    render(<PaymentCancelled />);
    
    expect(screen.getByText(/Payment Cancelled/i)).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to event page in 10 seconds/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Return to Event Now/i })).toBeInTheDocument();
    expect(screen.getByTestId("cancel-icon")).toBeInTheDocument();
  });

  test("manual return button navigates immediately", () => {
    (useParams as jest.Mock).mockReturnValue({ id: "789" });
    render(<PaymentCancelled />);
    
    fireEvent.click(screen.getByRole("button", { name: /Return to Event Now/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/events/789");
  });

  test("auto-redirects after 10 seconds", async () => {
    render(<PaymentCancelled />);
    
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/events/123");
    });
  });

  test("updates countdown every second", () => {
    render(<PaymentCancelled />);
    
    expect(screen.getByText(/in 10 seconds/i)).toBeInTheDocument();

    jest.advanceTimersByTime(3000);
    expect(screen.getByText(/in 7 seconds/i)).toBeInTheDocument();

    jest.advanceTimersByTime(7000);
    expect(screen.getByText(/in 0 seconds/i)).toBeInTheDocument();
  });

  test("cleans up timer and interval on unmount", () => {
    (useParams as jest.Mock).mockReturnValue({ id: "456" });
    const { unmount } = render(<PaymentCancelled />);
    
    const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
    const clearIntervalSpy = jest.spyOn(window, "clearInterval");

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});