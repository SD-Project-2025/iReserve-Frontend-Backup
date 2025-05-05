import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EventsPage from '@/pages/events/EventsPage' // Update with your actual path
import { MemoryRouter } from 'react-router-dom'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))

// Mock api service
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
  },
}))

describe('EventsPage Component', () => {
  const mockEvents = [
    {
      event_id: 1,
      title: "Community Yoga Class",
      description: "Morning yoga session open to all residents.",
      facility: {
        name: "Fitness Center",
        facility_id: 101,
      },
      start_date: "2025-04-01",
      end_date: "2025-04-01",
      start_time: "08:00",
      end_time: "09:00",
      status: "upcoming",
      image_url: "/yoga.jpg",
      max_attendees: 30,
      current_attendees: 15,
    },
    {
      event_id: 2,
      title: "Tennis Tournament",
      description: "Annual tennis competition for residents and staff.",
      facility: {
        name: "Tennis Court",
        facility_id: 102,
      },
      start_date: "2025-04-05",
      end_date: "2025-04-05",
      start_time: "10:00",
      end_time: "16:00",
      status: "ongoing",
      image_url: "",
      max_attendees: 20,
      current_attendees: 18,
    },
    {
      event_id: 3,
      title: "Art Exhibition",
      description: "Showcasing local artists and community art projects.",
      facility: null,
      start_date: "2025-04-10",
      end_date: "2025-04-12",
      start_time: "12:00",
      end_time: "18:00",
      status: "completed",
      image_url: "/art.jpg",
      max_attendees: 100,
      current_attendees: 95,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders page title and search input', () => {
    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/community events/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument()
  })

  it('shows loading indicator while fetching data', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error message when fetching fails', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockRejectedValueOnce(new Error('API Error'))

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load events/i)).toBeInTheDocument()
    })
  })

  it('displays all events when no search term is entered', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { level: 6 }).length).toBeGreaterThan(0)
    })

    expect(screen.getByText(/community yoga class/i)).toBeInTheDocument()
    expect(screen.getByText(/tennis tournament/i)).toBeInTheDocument()
    expect(screen.getByText(/art exhibition/i)).toBeInTheDocument()
  })

  it('filters events by search term', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const searchInput = await screen.findByPlaceholderText(/search events/i)

    fireEvent.change(searchInput, { target: { value: 'yoga' } })

    expect(screen.getByText(/community yoga class/i)).toBeInTheDocument()
    expect(screen.queryByText(/tennis tournament/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/art exhibition/i)).not.toBeInTheDocument()
  })

  it('navigates to event detail on card click', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [mockEvents[0]] } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const card = await screen.findByRole('button', { name: /community yoga class/i })
    fireEvent.click(card)

    expect(navigateMock).toHaveBeenCalledWith('/events/1', {
      state: { id: 1 },
    })
  })

  it('displays correct date range for single-day event', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [mockEvents[0]] } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const card = await screen.findByRole('button', { name: /community yoga class/i })
    fireEvent.click(card)

    // Check that the formatted date is displayed correctly
    expect(screen.getByText("Apr 1, 2025")).toBeInTheDocument()
  })

  it('displays date range for multi-day event', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [mockEvents[2]] } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const card = await screen.findByRole('button', { name: /art exhibition/i })
    fireEvent.click(card)

    // Check that both dates are shown
    expect(screen.getByText("Apr 10, 2025 - Apr 12, 2025")).toBeInTheDocument()
  })

  it('shows chip with correct color based on event status', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const statusChips = await screen.findAllByTestId('chip')

    // Check text content
    expect(statusChips[0]).toHaveTextContent('upcoming')
    expect(statusChips[1]).toHaveTextContent('ongoing')
    expect(statusChips[2]).toHaveTextContent('completed')

    // Check colors (via MUI class names)
    expect(statusChips[0]).toHaveClass('MuiChip-colorSuccess')
    expect(statusChips[1]).toHaveClass('MuiChip-colorWarning')
    expect(statusChips[2]).toHaveClass('MuiChip-colorDefault')
  })

  it('shows registration status chip with appropriate label and color', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const registrationChips = await screen.findAllByTestId('registration-chip')

    // First event has space available
    expect(registrationChips[0]).toHaveTextContent('Registration Open')
    expect(registrationChips[0]).toHaveClass('MuiChip-colorSuccess')

    // Second event is almost full
    expect(registrationChips[1]).toHaveTextContent('Registration Open')
    expect(registrationChips[1]).toHaveClass('MuiChip-colorSuccess')

    // Third event is completed
    expect(registrationChips[2]).toHaveTextContent('Fully Booked')
    expect(registrationChips[2]).toHaveClass('MuiChip-colorError')
  })

  it('uses default image if image_url is missing', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [mockEvents[1]] } }) // event.image_url is empty

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const image = await screen.findByAltText(/tennis tournament/i)
    expect(image).toHaveAttribute('src', '/placeholder.svg?height=160&width=320')
  })

  it('truncates long descriptions', async () => {
    const longDescriptionEvent = {
      ...mockEvents[0],
      description:
        "This is a very long description that should be truncated to show only the first 100 characters followed by an ellipsis.",
    }

    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [longDescriptionEvent] } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const description = await screen.findByText(/.../)
    expect(description).toHaveTextContent(expect.stringContaining('...'))
  })

  it('displays attendee count correctly', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    const attendeesTexts = await screen.findAllByText(/attendees/i)

    expect(attendeesTexts[0]).toHaveTextContent('15/30 attendees')
    expect(attendeesTexts[1]).toHaveTextContent('18/20 attendees')
    expect(attendeesTexts[2]).toHaveTextContent('95/100 attendees')
  })

  it('shows no events message when list is empty', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [] } })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/no events found/i)).toBeInTheDocument()
    })
  })

  it('does not display registration chip for completed or cancelled events', async () => {
    const completedEvent = {
      ...mockEvents[2],
      status: 'completed',
    }
    const cancelledEvent = {
      ...mockEvents[2],
      event_id: 4,
      status: 'cancelled',
    }

    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({
      data: {
        data: [completedEvent, cancelledEvent],
      },
    })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('registration-chip')).not.toBeInTheDocument()
    })
  })

  it('shows facility name or "Unknown" if facility is missing', async () => {
    const eventWithoutFacility = {
      ...mockEvents[2],
      facility: null,
    }

    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({
      data: {
        data: [eventWithoutFacility],
      },
    })

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/unknown facility/i)).toBeInTheDocument()
    })
  })
})