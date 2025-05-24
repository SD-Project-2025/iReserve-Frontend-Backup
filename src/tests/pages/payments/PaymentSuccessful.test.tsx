import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PaymentSuccessful from "@/pages/payments/PaymentSuccessful";
import { useNavigate, useParams } from "react-router-dom";


// Mock react-router hooks
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
  };
});

describe("PaymentSuccessful Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useNavigate as jest.Mock).mockImplementation(() => mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ id: "123" });
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders payment success page with correct content", () => {
    (useParams as jest.Mock).mockReturnValue({ id: "456" });
    render(<PaymentSuccessful />);
    
    expect(screen.getByText(/Payment Successful/i)).toBeInTheDocument();
    expect(screen.getByText(/Redirecting to event page in 10 seconds/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Return to Event Now/i })).toBeInTheDocument();
    expect(screen.getByTestId("success-icon")).toBeInTheDocument();
  });

  test("manual return button navigates immediately", () => {
    (useParams as jest.Mock).mockReturnValue({ id: "789" });
    render(<PaymentSuccessful />);
    
    fireEvent.click(screen.getByRole("button", { name: /Return to Event Now/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/events/789");
  });

  test("auto-redirects after 10 seconds", async () => {
    render(<PaymentSuccessful />);
    
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/events/123");
    });
  });

  test("updates countdown every second", () => {
    render(<PaymentSuccessful />);
    
    expect(screen.getByText(/in 10 seconds/i)).toBeInTheDocument();

    jest.advanceTimersByTime(3000);
    expect(screen.getByText(/in 7 seconds/i)).toBeInTheDocument();

    jest.advanceTimersByTime(7000);
    expect(screen.getByText(/in 0 seconds/i)).toBeInTheDocument();
  });

  test("cleans up timer and interval on unmount", () => {
    (useParams as jest.Mock).mockReturnValue({ id: "456" });
    const { unmount } = render(<PaymentSuccessful />);
    
    const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
    const clearIntervalSpy = jest.spyOn(window, "clearInterval");

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});