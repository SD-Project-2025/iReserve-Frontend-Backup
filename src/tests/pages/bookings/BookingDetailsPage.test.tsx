import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import BookingDetailsPage from "@/pages/bookings/BookingDetailsPage"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { api } from "@/services/api"
import MockAdapter from "axios-mock-adapter"

const mock = new MockAdapter(api)

const mockBooking = {
  booking_id: 1,
  facility: {
    facility_id: 10,
    name: "Main Hall",
    location: "Campus North"
  },
  date: "2025-05-05",
  start_time: "10:00",
  end_time: "11:00",
  status: "approved",
  purpose: "Team Meeting",
  attendees: 12,
  notes: "Bring projectors.",
  created_at: "2025-04-01T10:00:00Z"
}

const renderWithRoute = (id: string) => {
  return render(
    <MemoryRouter initialEntries={[`/bookings/${id}`]}>
      <Routes>
        <Route path="/bookings/:id" element={<BookingDetailsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("BookingDetailsPage", () => {
  afterEach(() => {
    mock.reset()
  })

  test("renders loading state initially", () => {
    renderWithRoute("1")
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  test("displays error if booking ID is not provided", async () => {
    render(
      <MemoryRouter initialEntries={[`/bookings/`]}>
        <Routes>
          <Route path="/bookings/:id" element={<BookingDetailsPage />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/no booking id provided/i)).toBeInTheDocument()
    })
  })

  test("fetches and displays booking details", async () => {
    mock.onGet("/bookings/1").reply(200, { data: mockBooking })

    renderWithRoute("1")

    await waitFor(() => {
      expect(screen.getByText("Booking Details")).toBeInTheDocument()
      expect(screen.getByText("Team Meeting")).toBeInTheDocument()
      expect(screen.getByText(/Main Hall • Campus North/)).toBeInTheDocument()
      expect(screen.getByText(/12 attendees/)).toBeInTheDocument()
    })
  })

  test("shows error message on API failure", async () => {
    mock.onGet("/bookings/1").reply(500)

    renderWithRoute("1")

    await waitFor(() => {
      expect(screen.getByText(/failed to load booking details/i)).toBeInTheDocument()
    })
  })

  test("opens cancel dialog when clicking cancel button", async () => {
    mock.onGet("/bookings/1").reply(200, { data: mockBooking })

    renderWithRoute("1")

    await waitFor(() => {
      fireEvent.click(screen.getByText(/cancel booking/i))
    })

    expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument()
  })

  test("successfully cancels booking", async () => {
    mock.onGet("/bookings/1").reply(200, { data: mockBooking })
    mock.onPut("/bookings/1/cancel").reply(200)
    mock.onGet("/bookings/1").reply(200, {
      data: { ...mockBooking, status: "cancelled" }
    })

    renderWithRoute("1")

    await waitFor(() => fireEvent.click(screen.getByText(/cancel booking/i)))
    await waitFor(() => fireEvent.click(screen.getByText(/yes, cancel booking/i)))

    await waitFor(() => {
      expect(screen.getByText("cancelled")).toBeInTheDocument()
    })
  })
})
