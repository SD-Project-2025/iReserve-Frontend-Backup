import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import { api } from "@/services/api";
import { vi } from "vitest";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("NotificationsPage Component", () => {
  const mockNotifications = [
    {
      notification_id: 1,
      title: "Booking Confirmation",
      message: "Your booking has been confirmed.",
      type: "booking",
      created_at: new Date().toISOString(),
      read: false,
    },
    {
      notification_id: 2,
      title: "Maintenance Update",
      message: "Maintenance is scheduled for next Monday.",
      type: "maintenance",
      created_at: new Date().toISOString(),
      read: true,
    },
  ];

  test("renders loading state initially", () => {
    render(<NotificationsPage />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("displays notifications after API fetch", async () => {
    api.get.mockResolvedValueOnce({ data: { data: mockNotifications } });

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Booking Confirmation")).toBeInTheDocument();
      expect(screen.getByText("Maintenance Update")).toBeInTheDocument();
    });
  });

  test("marks a notification as read", async () => {
    api.get.mockResolvedValueOnce({ data: { data: mockNotifications } });
    (api.put as jest.Mock).mockResolvedValueOnce({});

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Booking Confirmation")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark as Read"));

    await waitFor(() => {
      expect(screen.queryByText("Mark as Read")).not.toBeInTheDocument();
    });
  });

  test("marks all notifications as read", async () => {
    api.get.mockResolvedValueOnce({ data: { data: mockNotifications } });
    (api.put as jest.Mock).mockResolvedValueOnce({});

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Mark All as Read")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark All as Read"));

    await waitFor(() => {
      expect(screen.queryByText("Mark All as Read")).not.toBeInTheDocument();
    });
  });

  test("handles API fetch error", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("Failed to load"));

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load notifications. Please try again later.")).toBeInTheDocument();
    });
  });
});
