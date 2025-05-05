import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BookingsPage from '@/pages/bookings/BookingsPage' // Update with your actual path
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
    put: jest.fn(),
  },
}))

describe('BookingsPage Component', () => {
  const mockBookings = [
    {
      booking_id: 1,
      facility_id: 101,
      resident_id: 201,
      date: '2025-04-01',
      start_time: '10:00',
      end_time: '12:00',
      status: 'approved',
      purpose: 'Team Practice',
      attendees: 10,
      Facility: {
        name: 'Basketball Court',
        type: 'Indoor',
        location: 'Main Building',
        facility_id: 101,
      },
    },
    {
      booking_id: 2,
      facility_id: 102,
      resident_id: 202,
      date: '2025-04-02',
      start_time: '14:00',
      end_time: '16:00',
      status: 'pending',
      purpose: 'Meeting',
      attendees: 5,
      Facility: {
        name: 'Conference Room',
        type: 'Meeting Space',
        location: 'Building B',
        facility_id: 102,
      },
    },
    {
      booking_id: 3,
      facility_id: 103,
      resident_id: 203,
      date: '2025-04-03',
      start_time: '09:00',
      end_time: '10:00',
      status: 'rejected',
      purpose: 'Private Use',
      attendees: 2,
      Facility: null, // Simulate missing facility
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders page title and create button', () => {
    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/my bookings/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new booking/i })).toBeInTheDocument()
  })

  it('shows loading indicator while fetching data', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error message when fetching fails', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockRejectedValueOnce(new Error('API Error'))

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load bookings/i)).toBeInTheDocument()
    })
  })

  it('displays all bookings when "All" tab is selected', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockBookings } })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/basketball court/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/conference room/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/private use/i).length).toBeGreaterThan(0)
    })
  })

  it('filters bookings by Approved tab', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockBookings } })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    const approvedTab = await screen.findByLabelText(/approved/i)
    fireEvent.click(approvedTab)

    expect(screen.getByText(/team practice/i)).toBeInTheDocument()
    expect(screen.queryByText(/meeting/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/private use/i)).not.toBeInTheDocument()
  })

  it('filters bookings by Pending tab', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockBookings} })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    const pendingTab = await screen.findByLabelText(/pending/i)
    fireEvent.click(pendingTab)

    expect(screen.getByText(/meeting/i)).toBeInTheDocument()
    expect(screen.queryByText(/team practice/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/private use/i)).not.toBeInTheDocument()
  })

  it('filters bookings by Rejected/Cancelled tab', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockBookings } })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    const rejectedTab = await screen.findByLabelText(/rejected\/cancelled/i)
    fireEvent.click(rejectedTab)

    expect(screen.getByText(/private use/i)).toBeInTheDocument()
    expect(screen.queryByText(/team practice/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/meeting/i)).not.toBeInTheDocument()
  })

  it('navigates to create booking page on button click', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /new booking/i }))
    expect(navigateMock).toHaveBeenCalledWith('/bookings/create')
  })

  it('navigates to view booking on icon click', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [mockBookings[0]] } })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    const viewIcon = await screen.findByLabelText(/view/i)
    fireEvent.click(viewIcon)

    expect(navigateMock).toHaveBeenCalledWith('/bookings/1')
  })

  it('cancels booking and refreshes list', async () => {
    const apiGetMock = require('@/services/api').api.get
    const apiPutMock = require('@/services/api').api.put
    apiGetMock.mockResolvedValueOnce({ data: { data: [mockBookings[1]] } })
    apiPutMock.mockResolvedValueOnce({})

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    const cancelIcon = await screen.findByLabelText(/cancel/i)
    fireEvent.click(cancelIcon)

    await waitFor(() => {
      expect(apiPutMock).toHaveBeenCalledWith('/bookings/2/cancel', {})
    })

    // After cancellation, the API call should be made again to refresh bookings
    expect(apiGetMock).toHaveBeenCalledTimes(2)
  })

  it('shows Unknown Facility when Facility is missing', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [mockBookings[2]] } })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/unknown facility/i)).toBeInTheDocument()
      expect(screen.getByText(/private use/i)).toBeInTheDocument()
    })
  })

  it('shows no bookings message when list is empty', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: [] } })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/no bookings found/i)).toBeInTheDocument()
    })
  })

  it('navigates to create booking when "Create a Booking" button is clicked', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    const createButton = screen.getByRole('button', { name: /create a booking/i })
    fireEvent.click(createButton)

    expect(navigateMock).toHaveBeenCalledWith('/bookings/create')
  })

  it('renders correct status chips with colors', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockBookings } })

    render(
      <MemoryRouter>
        <BookingsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      const statusChips = screen.getAllByTestId('chip')

      // Check text content
      expect(statusChips[0]).toHaveTextContent('approved')
      expect(statusChips[1]).toHaveTextContent('pending')
      expect(statusChips[2]).toHaveTextContent('rejected')

      // Check color classes or styles
      expect(statusChips[0]).toHaveClass('MuiChip-colorSuccess')
      expect(statusChips[1]).toHaveClass('MuiChip-colorWarning')
      expect(statusChips[2]).toHaveClass('MuiChip-colorError')
    })
  })
})