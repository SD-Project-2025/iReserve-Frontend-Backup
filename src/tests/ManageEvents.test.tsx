// ManageEventsPage.test.tsx
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ManageEventsPage from '@/pages/admin/ManageEventsPage'
import { api } from '@/services/api'
import '@testing-library/jest-dom'

// Mock the API module
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}))

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockEvents = [
  {
    event_id: 1,
    title: 'Test Event 1',
    description: 'Test Description 1',
    facility_id: 1,
    Facility: {
      name: 'Community Hall',
      type: 'Hall',
      location: 'Building A',
      facility_id: 1,
    },
    start_date: '2024-03-01',
    end_date: '2024-03-01',
    start_time: '09:00',
    end_time: '12:00',
    status: 'upcoming',
    capacity: 100,
    current_attendees: 50,
    image_url: 'test.jpg',
    is_public: true,
    registration_deadline: '2024-02-28',
    fee: '10.00',
    organizer: {
      staff_id: 1,
      employee_id: 'EMP001',
      position: 'Manager',
    },
  },
  {
    event_id: 2,
    title: 'Test Event 2',
    description: 'Test Description 2',
    facility_id: 2,
    Facility: {
      name: 'Sports Complex',
      type: 'Sports',
      location: 'Building B',
      facility_id: 2,
    },
    start_date: '2024-03-02',
    end_date: '2024-03-03',
    start_time: '14:00',
    end_time: '16:00',
    status: 'ongoing',
    capacity: 200,
    current_attendees: 180,
    image_url: 'test2.jpg',
    is_public: false,
    registration_deadline: '2024-02-29',
    fee: '0.00',
    organizer: {
      staff_id: 2,
      employee_id: 'EMP002',
      position: 'Coordinator',
    },
  },
  {
    event_id: 3,
    title: 'Test Event 3',
    description: 'Test Description 3',
    facility_id: 1,
    Facility: {
      name: 'Community Hall',
      type: 'Hall',
      location: 'Building A',
      facility_id: 1,
    },
    start_date: '2024-02-28',
    end_date: '2024-02-28',
    start_time: '10:00',
    end_time: '11:00',
    status: 'completed',
    capacity: 50,
    image_url: 'test3.jpg',
    is_public: true,
    registration_deadline: '2024-02-27',
    fee: '5.00',
    organizer: {
      staff_id: 1,
      employee_id: 'EMP001',
      position: 'Manager',
    },
  },
  {
    event_id: 4,
    title: 'Cancelled Event',
    description: 'This event was cancelled',
    facility_id: 2,
    Facility: {
      name: 'Sports Complex',
      type: 'Sports',
      location: 'Building B',
      facility_id: 2,
    },
    start_date: '2024-03-04',
    end_date: '2024-03-04',
    start_time: '15:00',
    end_time: '17:00',
    status: 'cancelled',
    capacity: 75,
    current_attendees: 0,
    image_url: 'test4.jpg',
    is_public: true,
    registration_deadline: '2024-03-03',
    fee: '15.00',
    organizer: {
      staff_id: 2,
      employee_id: 'EMP002',
      position: 'Coordinator',
    },
  },
]

const mockAdminProfile = {
  data: {
    data: {
      profile: {
        staff_id: 1,
        is_admin: true,
      },
    },
  },
}

const mockStaffProfile = {
  data: {
    data: {
      profile: {
        staff_id: 2,
        is_admin: false,
      },
    },
  },
}

describe('ManageEventsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Admin User Tests', () => {
    beforeEach(() => {
      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockAdminProfile)
        }
        if (url === '/events') {
          return Promise.resolve({ data: { data: mockEvents } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
    })

    test('renders correctly for admin users', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Manage Events')).toBeInTheDocument()
        expect(screen.getByText('Create Event')).toBeInTheDocument()
      })

      // Check status cards
      expect(screen.getByText('UPCOMING')).toBeInTheDocument()
      expect(screen.getByText('ONGOING')).toBeInTheDocument()
      expect(screen.getByText('COMPLETED')).toBeInTheDocument()
      expect(screen.getByText('CANCELLED')).toBeInTheDocument()
    })

    test('displays correct event counts in status cards', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        // Check counts - based on mockEvents: 1 upcoming, 1 ongoing, 1 completed, 1 cancelled
        const upcomingCards = screen.getAllByText('1')
        expect(upcomingCards).toHaveLength(4) // All counts are 1
      })
    })

    test('handles search functionality', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by title, description or facility...')
        fireEvent.change(searchInput, { target: { value: 'Test Event 1' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 events')).toBeInTheDocument()
      })
    })

    test('handles facility search functionality', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by title, description or facility...')
        fireEvent.change(searchInput, { target: { value: 'Community Hall' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 4 events')).toBeInTheDocument()
      })
    })

    test('handles facility type search', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by title, description or facility...')
        fireEvent.change(searchInput, { target: { value: 'Sports' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 4 events')).toBeInTheDocument()
      })
    })

    test('handles facility location search', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by title, description or facility...')
        fireEvent.change(searchInput, { target: { value: 'Building A' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 4 events')).toBeInTheDocument()
      })
    })

    test('handles status filter', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const statusSelect = screen.getByLabelText('Status')
        fireEvent.mouseDown(statusSelect)
      })

      const upcomingOption = screen.getByText('Upcoming')
      fireEvent.click(upcomingOption)

      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 events')).toBeInTheDocument()
      })
    })

    test('handles facility filter', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const facilitySelect = screen.getByLabelText('Facility')
        fireEvent.mouseDown(facilitySelect)
      })

      const facilityOption = screen.getByText('Community Hall')
      fireEvent.click(facilityOption)

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 4 events')).toBeInTheDocument()
      })
    })

    test('handles clear filters', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      // Apply search filter first
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by title, description or facility...')
        fireEvent.change(searchInput, { target: { value: 'Test Event 1' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Clear Filters'))
      })

      await waitFor(() => {
        expect(screen.getByText('Showing 4 of 4 events')).toBeInTheDocument()
      })
    })

    test('handles refresh functionality', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const refreshButton = screen.getByLabelText('Refresh data')
        fireEvent.click(refreshButton)
      })

      expect(api.get).toHaveBeenCalledWith('/auth/me')
      expect(api.get).toHaveBeenCalledWith('/events')
    })

    test('handles navigation to create event', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const createButton = screen.getByText('Create Event')
        fireEvent.click(createButton)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/admin/events/create')
    })

    test('handles navigation to view event', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const viewButtons = screen.getAllByLabelText('View event details')
        fireEvent.click(viewButtons[0])
      })

      expect(mockNavigate).toHaveBeenCalledWith('/admin/events/1')
    })

    test('handles navigation to edit event', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit event')
        fireEvent.click(editButtons[0])
      })

      expect(mockNavigate).toHaveBeenCalledWith('/admin/events/1/edit')
    })

    test('handles delete dialog open and close', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete event')
        fireEvent.click(deleteButtons[0])
      })

      await waitFor(() => {
        expect(screen.getByText('Delete Event')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to delete the event/)).toBeInTheDocument()
      })

      // Close dialog
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Delete Event')).not.toBeInTheDocument()
      })
    })

    test('handles successful event deletion', async () => {
      ;(api.delete as jest.Mock).mockResolvedValue({})

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      // Open delete dialog
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete event')
        fireEvent.click(deleteButtons[0])
      })

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete/i })
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/events/1')
      })
    })

    test('handles delete error', async () => {
      ;(api.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete event')
        fireEvent.click(deleteButtons[0])
      })

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /delete/i })
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting event:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Non-Admin Staff User Tests', () => {
    test('handles staff user with assigned facilities', async () => {
      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockStaffProfile)
        }
        if (url === '/events/staff/2/events') {
          return Promise.resolve({ data: { data: mockEvents.slice(0, 2) } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Manage Events')).toBeInTheDocument()
        expect(api.get).toHaveBeenCalledWith('/events/staff/2/events')
      })
    })

    test('handles staff user with no assigned facilities - API message', async () => {
      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockStaffProfile)
        }
        if (url === '/events/staff/2/events') {
          return Promise.resolve({ 
            data: { 
              message: 'No facilities assigned to this staff member.',
              data: [] 
            } 
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('No facilities are assigned to you. Please contact administrator.')).toBeInTheDocument()
      })
    })

    test('handles staff user with no assigned facilities - API error', async () => {
      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockStaffProfile)
        }
        if (url === '/events/staff/2/events') {
          return Promise.reject({
            response: {
              data: {
                message: 'No facilities assigned to this staff member.'
              }
            }
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('No facilities are assigned to you. Please contact administrator.')).toBeInTheDocument()
      })
    })

    test('handles staff user API error (non-facility related)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockStaffProfile)
        }
        if (url === '/events/staff/2/events') {
          return Promise.reject(new Error('Server error'))
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching staff events:', expect.any(Error))
        expect(screen.getByText('You currently have no facilities assigned to you. Please contact your administrator.')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling Tests', () => {
    test('handles general API error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      ;(api.get as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching events:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Mobile View Tests', () => {
    beforeEach(() => {
      // Mock window.matchMedia for mobile view
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 959.95px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockAdminProfile)
        }
        if (url === '/events') {
          return Promise.resolve({ data: { data: mockEvents } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
    })

    test('renders mobile card view correctly', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Event 1')).toBeInTheDocument()
        expect(screen.getByText('Community Hall')).toBeInTheDocument()
      })
    })

    test('handles mobile view navigation', async () => {
      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View')
        fireEvent.click(viewButtons[0])
      })

      expect(mockNavigate).toHaveBeenCalledWith('/admin/events/1')
    })

    test('shows no events message in mobile view', async () => {
      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockAdminProfile)
        }
        if (url === '/events') {
          return Promise.resolve({ data: { data: [] } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('No events match your search criteria')).toBeInTheDocument()
      })
    })
  })

  describe('Event Data Handling Tests', () => {
    test('handles events without current_attendees', async () => {
      const eventsWithoutAttendees = mockEvents.map(event => {
        const { current_attendees, ...eventWithoutAttendees } = event
        return eventWithoutAttendees
      })

      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockAdminProfile)
        }
        if (url === '/events') {
          return Promise.resolve({ data: { data: eventsWithoutAttendees } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Manage Events')).toBeInTheDocument()
      })
    })

    test('handles events with undefined facility', async () => {
      const eventsWithUndefinedFacility = [
        {
          ...mockEvents[0],
          Facility: undefined,
        },
      ]

      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockAdminProfile)
        }
        if (url === '/events') {
          return Promise.resolve({ data: { data: eventsWithUndefinedFacility } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument()
      })
    })
  })

  test('handles snackbar close', async () => {
    ;(api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve(mockAdminProfile)
      }
      if (url === '/events') {
        return Promise.resolve({ data: { data: mockEvents } })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    ;(api.delete as jest.Mock).mockResolvedValue({})

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    // Trigger delete to show snackbar
    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('Delete event')
      fireEvent.click(deleteButtons[0])
    })

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(confirmButton)
    })

    // Wait for snackbar to appear and then close it
    await waitFor(() => {
      expect(screen.getByText('"Test Event 1" has been successfully deleted')).toBeInTheDocument()
    })

    // Simulate snackbar auto-close
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 4100))
    })
  })

  describe('Status and Icon Tests', () => {
    test('renders all status types with correct colors and icons', async () => {
      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockAdminProfile)
        }
        if (url === '/events') {
          return Promise.resolve({ data: { data: mockEvents } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('upcoming')).toBeInTheDocument()
        expect(screen.getByText('ongoing')).toBeInTheDocument()
        expect(screen.getByText('completed')).toBeInTheDocument()
        expect(screen.getByText('cancelled')).toBeInTheDocument()
      })
    })

    test('handles unknown status', async () => {
      const eventsWithUnknownStatus = [
        {
          ...mockEvents[0],
          status: 'unknown',
        },
      ]

      ;(api.get as jest.Mock).mockImplementation((url) => {
        if (url === '/auth/me') {
          return Promise.resolve(mockAdminProfile)
        }
        if (url === '/events') {
          return Promise.resolve({ data: { data: eventsWithUnknownStatus } })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })

      render(
        <MemoryRouter>
          <ManageEventsPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('unknown')).toBeInTheDocument()
      })
    })
  })
})