import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import NotificationsPage from "@/pages/notifications/NotificationsPage"
import { api } from "@/services/api"

// Mock the API module
jest.mock("@/services/api", () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}))

describe("NotificationsPage Component", () => {
  const mockNotifications: Notification[] = [
    {
      notification_id: 1,
      title: "Booking Approved",
      message: "Your booking has been confirmed.",
      type: "booking",
      created_at: new Date().toISOString(),
      read: false,
    },
    {
      notification_id: 2,
      title: "Facility Maintenance",
      message: "Pool will be closed for maintenance on Monday.",
      type: "maintenance",
      created_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
      read: true,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("renders loading state", async () => {
    ;(api.get as jest.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(resolve, 100)),
    )

    render(<NotificationsPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  test("renders error message if fetching fails", async () => {
    ;(api.get as jest.Mock).mockRejectedValueOnce(new Error("API Error"))

    render(<NotificationsPage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load notifications/i)).toBeInTheDocument()
    })
  })

  test("displays no notifications message when list is empty", async () => {
    ;(api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } })

    render(<NotificationsPage />)
    await waitFor(() => {
      expect(screen.getByText(/no notifications found/i)).toBeInTheDocument()
    })
  })

  test("renders all notifications with correct content", async () => {
    ;(api.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockNotifications } })

    render(<NotificationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Booking Approved/i)).toBeInTheDocument()
      expect(screen.getByText(/Facility Maintenance/i)).toBeInTheDocument()

      expect(screen.getByText(/Your booking has been confirmed./i)).toBeInTheDocument()
      expect(
        screen.getByText(/Pool will be closed for maintenance on Monday./i)
      ).toBeInTheDocument()

      expect(screen.getByText(/booking/i)).toBeInTheDocument()
      expect(screen.getByText(/maintenance/i)).toBeInTheDocument()

      const dates = screen.getAllByText(/:/)
      expect(dates.length).toBeGreaterThan(0)
    })
  })

  test("marks a single notification as read on button click", async () => {
    ;(api.get as jest.Mock).mockResolvedValueOnce({ data: [mockNotifications[0]] }) // Only one notification
    ;(api.put as jest.Mock).mockResolvedValueOnce({})

    render(<NotificationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Booking Approved/i)).toBeInTheDocument()
    })

    const markAsReadButton = screen.getByRole("button", { name: /mark as read/i })
    fireEvent.click(markAsReadButton)

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/notifications/1/read")
      expect(screen.queryByText(/mark as read/i)).not.toBeInTheDocument()
    })
  })

  test("marks all notifications as read when 'Mark All' is clicked", async () => {
    ;(api.get as jest.Mock).mockResolvedValueOnce({ data: mockNotifications })
    ;(api.put as jest.Mock).mockResolvedValueOnce({})

    render(<NotificationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Booking Approved/i)).toBeInTheDocument()
    })

    const markAllButton = screen.getByRole("button", { name: /mark all as read/i })
    fireEvent.click(markAllButton)

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/notifications/read-all")
      const readButtons = screen.queryAllByText(/mark as read/i)
      expect(readButtons.length).toBe(0)
    })
  })

  test("applies correct styles for unread notifications", async () => {
    ;(api.get as jest.Mock).mockResolvedValueOnce({ data: mockNotifications })

    render(<NotificationsPage />)

    await waitFor(() => {
      const unreadNotificationCard = screen.getByText(/Booking Approved/i).closest(".MuiListItem-root")
      expect(unreadNotificationCard).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0.04)" }) // MUI action.hover color
    })

    const readNotificationCard = screen.getByText(/Facility Maintenance/i).closest(".MuiListItem-root")
    expect(readNotificationCard).toHaveStyle({ backgroundColor: "transparent" })
  })
})