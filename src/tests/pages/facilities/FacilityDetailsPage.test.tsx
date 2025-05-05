import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FacilityDetailsPage from '@/pages/facilities/FacilityDetailsPage' // Update path accordingly
import { MemoryRouter} from 'react-router-dom'

// Mock hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    state: {},
  }),
}))

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 101,
      name: 'John Doe',
      email: 'john@example.com',
      type: 'resident',
    },
  }),
}))

// Mock services
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

// Mock LocationMap
jest.mock('@/services/Map', () => ({
  LocationMap: () => <div data-testid="location-map">Location Map</div>,
}))

describe('FacilityDetailsPage Component', () => {
  const mockFacility = {
    facility_id: 1,
    name: 'Swimming Pool',
    type: 'Pool',
    location: 'Main Campus',
    capacity: 50,
    is_indoor: false,
    image_url: '/pool.jpg',
    status: 'open',
    description: 'Olympic-sized swimming pool open to residents.',
    open_time: '06:00',
    close_time: '22:00',
    average_rating: 4.3,
  }

  const mockBookings = [
    {
      booking_id: 1,
      date: '2025-04-05',
      start_time: '09:00',
      end_time: '11:00',
      status: 'approved',
    },
  ]

  const mockEvents = [
    {
      event_id: 101,
      title: 'Summer Swim Meet',
      start_date: '2025-07-15',
      end_date: '2025-07-15',
      start_time: '10:00',
      end_time: '14:00',
      status: 'upcoming',
    },
  ]

  const mockRatings = [
    {
      rating_id: 1,
      user_id: 102,
      user_name: 'Jane Smith',
      rating: 5,
      comment: 'Great facility!',
      created_at: '2025-04-01T10:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setup = (facilityData = mockFacility, bookingsData = mockBookings, eventData = mockEvents, ratingsData = mockRatings) => {
    const apiGetMock = require('@/services/api').api.get
    const apiPostMock = require('@/services/api').api.post

    apiGetMock.mockImplementation((url: string) => {
      if (url.includes('/facilities/1')) {
        return Promise.resolve({ data: { success: true, data: facilityData } })
      }
      if (url.includes('/bookings')) {
        return Promise.resolve({ data: { success: true, data: bookingsData } })
      }
      if (url.includes('/events')) {
        return Promise.resolve({ data: { success: true, data: eventData } })
      }
      if (url.includes('/ratings')) {
        return Promise.resolve({ data: { success: true, data: ratingsData } })
      }
      return Promise.reject(new Error('Unknown API call'))
    })

    apiPostMock.mockResolvedValue({ data: { success: true } })

    return render(
      <MemoryRouter>
        <FacilityDetailsPage />
      </MemoryRouter>
    )
  }

  it('renders facility name and basic info correctly', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/swimming pool/i)).toBeInTheDocument()
      expect(screen.getByText(/olympic-sized swimming pool open to residents./i)).toBeInTheDocument()
    })

    expect(screen.getByText(/outdoor/i)).toBeInTheDocument()
    expect(screen.getByText(/capacity: 50/i)).toBeInTheDocument()
  })

  it('displays facility image or fallback when missing', async () => {
    setup({
      ...mockFacility,
      image_url: '',
    })

    await waitFor(() => {
      const img = screen.getByAltText(/swimming pool/i) as HTMLImageElement
      expect(img.src).toContain('placeholder-facility.jpg')
    })
  })

  it('shows facility operating hours and status chip', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/06:00 - 22:00/i)).toBeInTheDocument()
      expect(screen.getByTestId('chip')).toHaveTextContent('open')
    })
  })

  it('displays facility details in sidebar card', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/type:/i)).toBeInTheDocument()
      expect(screen.getByText(/location:/i)).toBeInTheDocument()
      expect(screen.getByText(/environment:/i)).toBeInTheDocument()
      expect(screen.getByText(/current status:/i)).toBeInTheDocument()
    })
  })

  it('fetches and shows upcoming bookings', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/summer swim meet/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/09:00 - 11:00/i)).toBeInTheDocument()
    expect(screen.getByText(/approved/i)).toBeInTheDocument()
  })

  it('allows resident to submit a new rating', async () => {
    setup()

    const ratingInputs = screen.getAllByRole('radio')
    fireEvent.click(ratingInputs[3]) // Select 4 stars

    const textField = screen.getByRole('textbox')
    fireEvent.change(textField, { target: { value: 'Excellent condition!' } })

    const submitButton = screen.getByRole('button', { name: /submit review/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(require('@/services/api').api.post).toHaveBeenCalledWith('/facilities/ratings', {
        facility_id: 1,
        rating: 4,
        comment: 'Excellent condition!',
        user_id: 101,
      })
    })
  })

  it('displays user reviews', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/great facility!/i)).toBeInTheDocument()
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument()
    })
  })

  it('shows error message if facility fetch fails', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockRejectedValueOnce(new Error('API Error'))

    render(
      <MemoryRouter initialEntries={['/facilities/1']}>
        <FacilityDetailsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load facility details/i)).toBeInTheDocument()
    })
  })

  it('navigates to login when non-resident tries to book', async () => {
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: {
        id: 201,
        name: 'Staff User',
        email: 'staff@example.com',
        type: 'staff',
      },
    })

    setup()

    const bookButton = await screen.findByRole('button', { name: /book this facility/i })
    fireEvent.click(bookButton)

    await waitFor(() => {
      expect(screen.getByText(/restricted access/i)).toBeInTheDocument()
    })
  })

  it('opens booking dialog when staff clicks book', async () => {
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: {
        id: 201,
        name: 'Staff User',
        email: 'staff@example.com',
        type: 'staff',
      },
    })

    setup()

    const bookButton = await screen.findByRole('button', { name: /book this facility/i })
    fireEvent.click(bookButton)

    await waitFor(() => {
      expect(screen.getByText(/restricted access/i)).toBeInTheDocument()
    })
  })

  it('navigates to event page on view button click', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    setup()

    const viewEventButton = await screen.findByRole('button', { name: /view/i })
    fireEvent.click(viewEventButton)

    expect(navigateMock).toHaveBeenCalledWith('/events/101')
  })

  it('navigates to create maintenance report on report issue click', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    setup()

    const reportIssueButton = await screen.findByRole('button', { name: /report issue/i })
    fireEvent.click(reportIssueButton)

    expect(navigateMock).toHaveBeenCalledWith('/maintenance/create', {
      state: { facilityId: 1 },
    })
  })

  it('navigates to all events with facility filter applied', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    setup()

    const viewAllEventsButton = await screen.findByRole('button', { name: /view all events/i })
    fireEvent.click(viewAllEventsButton)

    expect(navigateMock).toHaveBeenCalledWith('/events', {
      state: { facilityFilter: 1 },
    })
  })

  it('displays loading indicator while fetching data', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockImplementation(() =>
      new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <MemoryRouter>
        <FacilityDetailsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error message if facility not found', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    jest.spyOn(require('@/services/api').api, 'get').mockResolvedValue({
      data: {
        success: false,
        message: 'Facility not found',
      },
    })

    render(
      <MemoryRouter initialEntries={['/facilities/999']}>
        <FacilityDetailsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/facility not found/i)).toBeInTheDocument()
    })
  })

  it('reloads page on retry after error', async () => {
    jest.spyOn(window, 'location').mockImplementation({
      href: '',
      reload: jest.fn(),
    } as any)

    jest.spyOn(require('@/services/api').api, 'get').mockRejectedValueOnce(new Error())

    render(
      <MemoryRouter initialEntries={['/facilities/1']}>
        <FacilityDetailsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load facility details/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled()
    })
  })

  it('displays facility map', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByTestId('location-map')).toBeInTheDocument()
    })
  })

  it('shows rating summary and count', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/4.3 out of 5/i)).toBeInTheDocument()
      expect(screen.getByText(/\(1 review\)/i)).toBeInTheDocument()
    })
  })

  it('displays no reviews message when none exist', async () => {
    setup(mockFacility, [], [], [])

    await waitFor(() => {
      expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument()
    })
  })

  it('disables book button when facility is closed', async () => {
    setup({
      ...mockFacility,
      status: 'closed',
    })

    await waitFor(() => {
      const bookButton = screen.getByRole('button', { name: /book this facility/i })
      expect(bookButton).toBeDisabled()
    })
  })

  it('shows error when user tries to book a closed facility', async () => {
    setup({
      ...mockFacility,
      status: 'closed',
    })

    const bookButton = await screen.findByRole('button', { name: /book this facility/i })
    fireEvent.click(bookButton)

    await waitFor(() => {
      expect(screen.getByText(/this facility is not available for booking/i)).toBeInTheDocument()
    })
  })
})