// EditEvent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EditEvent from '@/components/Events/EditEvent'

// Mock API calls
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn()
  }
}))

describe('EditEvent Component', () => {
  const mockFacility = { facility_id: 1, name: 'Main Hall' }
  const mockEvent = {
    event_id: 1,
    title: 'Test Event',
    description: 'A test event',
    facility_id: 1,
    start_date: '2025-04-01',
    end_date: '2025-04-02',
    start_time: '10:00',
    end_time: '12:00',
    organizer_staff_id: 1,
    status: 'upcoming',
    capacity: 100,
    image_url: '',
    is_public: true,
    registration_deadline: '2025-03-25'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading indicator initially', async () => {
    // Mock API to delay response
    require('@/services/api').api.get.mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error if fetching data fails', async () => {
    require('@/services/api').api.get.mockRejectedValueOnce(new Error('API Error'))

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load event data/i)).toBeInTheDocument()
    })
  })

  it('renders form fields with prefilled data', async () => {
    require('@/services/api').api.get.mockResolvedValueOnce({ data: { data: mockEvent } })
    require('@/services/api').api.get.mockResolvedValueOnce({ data: { data: [mockFacility] } })

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A test event')).toBeInTheDocument()
    })
  })

  it('submits the form successfully', async () => {
    const mockPut = require('@/services/api').api.put.mockResolvedValueOnce({})
    require('@/services/api').api.get.mockResolvedValueOnce({ data: { data: mockEvent } })
    require('@/services/api').api.get.mockResolvedValueOnce({ data: { data: [mockFacility] } })

    const { container } = render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      fireEvent.change(container.querySelector("input[name='title']")!, {
        target: { value: 'Updated Title' },
      })

      fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    })

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/events/1', expect.objectContaining({
        title: 'Updated Title'
      }))
    })
  })

  it('navigates back when cancel button is clicked', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    require('@/services/api').api.get.mockResolvedValueOnce({ data: { data: mockEvent } })
    require('@/services/api').api.get.mockResolvedValueOnce({ data: { data: [mockFacility] } })

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    })

    expect(navigateMock).toHaveBeenCalledWith('/events/1')
  })
})