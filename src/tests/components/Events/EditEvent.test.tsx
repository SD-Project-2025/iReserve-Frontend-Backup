
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import EditEvent from  '../../../components/Events/EditEvent'
import { api } from '@/services/api'

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}))

// Mock the API service
jest.mock('@/services/api', () => ({
  get: jest.fn(),
  put: jest.fn(),
}))

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation(() => '2023-01-01'),
}))

describe('EditEvent Component', () => {
  const mockNavigate = jest.fn()
  const mockLocation = {
    state: {
      id: '1',
    },
  }

  const mockEvent = {
    event_id: 1,
    title: 'Test Event',
    description: 'This is a test event',
    facility_id: 1,
    start_date: new Date('2023-01-01'),
    end_date: new Date('2023-01-02'),
    start_time: '10:00',
    end_time: '12:00',
    organizer_staff_id: 1,
    status: 'upcoming',
    capacity: 100,
    image_url: 'https://example.com/image.jpg',
    is_public: true,
    registration_deadline: new Date('2022-12-25'),
    fee: 0,
  }

  const mockFacilities = [
    { facility_id: 1, name: 'Main Hall' },
    { facility_id: 2, name: 'Conference Room' },
  ]

  beforeEach(() => {
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })
    ;(useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    ;(useLocation as jest.Mock).mockReturnValue(mockLocation)
    ;(api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/events/1') {
        return Promise.resolve({ data: { data: mockEvent } })
      }
      if (url === '/facilities') {
        return Promise.resolve({ data: { data: mockFacilities } })
      }
      return Promise.reject(new Error('Not found'))
    })
    ;(api.put as jest.Mock).mockResolvedValue({})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    render(<EditEvent />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  it('displays error message when data fetch fails', async () => {
    ;(api.get as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'))
    render(<EditEvent />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load event data/i)).toBeInTheDocument()
    })
  })

  it('renders event form with data after loading', async () => {
    render(<EditEvent />)
    await waitFor(() => {
      expect(screen.getByText(/edit event/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument()
      expect(screen.getByDisplayValue('This is a test event')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
      expect(screen.getByDisplayValue('0')).toBeInTheDocument()
    })
  })

  it('updates form fields when user inputs data', async () => {
    render(<EditEvent />)
    await waitFor(() => {
      const titleInput = screen.getByLabelText('Event Title')
      fireEvent.change(titleInput, { target: { value: 'Updated Event' } })
      expect(titleInput).toHaveValue('Updated Event')

      const descriptionInput = screen.getByLabelText('Description')
      fireEvent.change(descriptionInput, { target: { value: 'Updated description' } })
      expect(descriptionInput).toHaveValue('Updated description')

      const capacityInput = screen.getByLabelText('Capacity')
      fireEvent.change(capacityInput, { target: { value: '150' } })
      expect(capacityInput).toHaveValue(150)
    })
  })

  it('handles facility selection change', async () => {
    render(<EditEvent />)
    await waitFor(() => {
      const facilitySelect = screen.getByLabelText('Facility')
      fireEvent.change(facilitySelect, { target: { value: '2' } })
      expect(facilitySelect).toHaveValue('2')
    })
  })

  it('handles status selection change', async () => {
    render(<EditEvent />)
    await waitFor(() => {
      const statusSelect = screen.getByLabelText('Status')
      fireEvent.change(statusSelect, { target: { value: 'ongoing' } })
      expect(statusSelect).toHaveValue('ongoing')
    })
  })

  it('toggles public event switch', async () => {
    render(<EditEvent />)
    await waitFor(() => {
      const publicSwitch = screen.getByLabelText('Public Event')
      expect(publicSwitch).toBeChecked()
      fireEvent.click(publicSwitch)
      expect(publicSwitch).not.toBeChecked()
    })
  })

  it('submits the form with updated data', async () => {
    render(<EditEvent />)
    await waitFor(async () => {
      const titleInput = screen.getByLabelText('Event Title')
      fireEvent.change(titleInput, { target: { value: 'Updated Event' } })

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/events/1', {
          ...mockEvent,
          title: 'Updated Event',
          start_date: '2023-01-01',
          end_date: '2023-01-01',
          registration_deadline: '2023-01-01',
        })
        expect(mockNavigate).toHaveBeenCalledWith('/events/1', {
          state: { message: 'Event updated!' },
        })
      })
    })
  })

  it('handles form submission error', async () => {
    ;(api.put as jest.Mock).mockRejectedValueOnce(new Error('Update failed'))
    render(<EditEvent />)
    await waitFor(async () => {
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      fireEvent.click(submitButton)
      // You might want to add error state handling in your component to test this
    })
  })

  it('cancels and navigates back', async () => {
    render(<EditEvent />)
    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      expect(mockNavigate).toHaveBeenCalledWith('/events/1')
    })
  })

  it('displays status chip with correct color', async () => {
    render(<EditEvent />)
    await waitFor(() => {
      const statusChip = screen.getByText('upcoming')
      expect(statusChip).toHaveClass('MuiChip-colorPrimary')
    })
  })
})