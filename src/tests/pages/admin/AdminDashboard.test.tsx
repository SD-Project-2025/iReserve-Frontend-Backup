import { render, screen, waitFor } from '@testing-library/react'
import AdminDashboard from '@/pages/admin/AdminDashboard'; // Update path as needed
import { MemoryRouter } from 'react-router-dom'

// Mock child components
jest.mock('../../components/dashboard/DashboardCard', () => ({
  __esModule: true,
  default: ({ title, value }: { title: string; value: number }) => (
    <div data-testid="dashboard-card">
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}))

jest.mock('../../components/dashboard/RecentActivityList', () => ({
  __esModule: true,
  default: ({ title, activities, loading }: { title: string; activities: any[]; loading: boolean }) => (
    <div data-testid="recent-activity-list">
      <h3>{title}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : activities.length > 0 ? (
        activities.map((act, idx) => <div key={idx}>{act.title}</div>)
      ) : (
        <p>No data</p>
      )}
    </div>
  ),
}))

// Mock API calls
jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn(),
  },
}))

describe('AdminDashboard Component', () => {
  const mockBookings = [
    { booking_id: 1, facility: { name: 'Gym' }, purpose: 'Workout', attendees: 20, status: 'approved', start_time: '08:00', end_time: '10:00', date: '2025-04-05' },
  ]

  const mockFacilities = [
    { facility_id: 1, name: 'Gym', type: 'Indoor', location: 'Main Building', status: 'active', open_time: '06:00', close_time: '22:00' },
  ]

  const mockMaintenanceReports = [
    { report_id: 1, title: 'Broken AC', reported_date: '2025-04-01', status: 'in-progress' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the dashboard heading', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument()
  })

  it('displays statistics cards', async () => {
    jest.spyOn(require('../../services/api'), 'api').get
      .mockResolvedValueOnce({ data: { data: mockBookings } })
      .mockResolvedValueOnce({ data: { data: mockFacilities } })
      .mockResolvedValueOnce({ data: { data: mockMaintenanceReports } })

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('dashboard-card')).toHaveLength(4)
    })

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Total Facilities')).toBeInTheDocument()
    expect(screen.getByText('Total Bookings')).toBeInTheDocument()
    expect(screen.getByText('Total Events')).toBeInTheDocument()
  })

  it('shows loading state in RecentActivityList components', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )

    expect(screen.getAllByText(/loading/i)).toBeTruthy()
  })

  it('navigates to correct URL when quick action buttons are clicked', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )

    const manageUsersButton = screen.getByRole('button', { name: /manage users/i })
    fireEvent.click(manageUsersButton)
    expect(navigateMock).toHaveBeenCalledWith('/admin/users')
  })

  it('renders tabs and switches content', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )

    const userTab = screen.getByRole('tab', { name: /users/i })
    const facilityTab = screen.getByRole('tab', { name: /facilities/i })
    
    expect(userTab).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(facilityTab)
    expect(facilityTab).toHaveAttribute('aria-selected', 'true')
  })

  it('displays error message if data fetching fails', async () => {
    jest.spyOn(require('../../services/api'), 'api').get.mockRejectedValue(new Error('API Error'))

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument()
    })
  })
})