import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MaintenanceDetailsPage from '@/pages/MaintenanceDetailsPage' // Update path accordingly
import { MemoryRouter} from 'react-router-dom'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn(),
}))

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 101,
      name: 'John Doe',
      email: 'john@example.com',
      type: 'staff',
    },
  }),
}))

// Mock api service
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}))

describe('MaintenanceDetailsPage Component', () => {
  const mockReport = {
    report_id: 1,
    title: "Broken AC Unit",
    description: "AC unit in Gym not functioning properly.",
    facility: {
      facility_id: 101,
      name: "Gym",
      location: "Main Building",
    },
    user: {
      user_id: 201,
      name: "Jane Smith",
      email: "jane@example.com",
    },
    reported_date: "2025-04-01T10:00:00Z",
    status: "in-progress",
    priority: "high",
    assigned_to: {
      user_id: 301,
      name: "Maintenance Team",
    },
    comments: [
      {
        id: 1,
        text: "Initial inspection completed.",
        created_at: "2025-04-02T12:00:00Z",
        user: {
          name: "Technician A",
          user_id: 401,
        },
      },
    ],
    history: [
      {
        id: 1,
        status: "reported",
        created_at: "2025-04-01T10:00:00Z",
        user: {
          name: "Jane Smith",
        },
        notes: "Report submitted.",
      },
      {
        id: 2,
        status: "in-progress",
        created_at: "2025-04-02T12:00:00Z",
        user: {
          name: "Technician A",
        },
        notes: "Inspection started.",
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setup = (reportData = mockReport) => {
    const apiGetMock = require('@/services/api').api.get
    const apiPostMock = require('@/services/api').api.post
    const apiPutMock = require('@/services/api').api.put

    apiGetMock.mockResolvedValue({ data: { data: reportData } })
    apiPostMock.mockResolvedValue({ data: { success: true } })
    apiPutMock.mockResolvedValue({ data: { success: true } })

    return render(
      <MemoryRouter initialEntries={['/maintenance/1']}>
        <MaintenanceDetailsPage />
      </MemoryRouter>
    )
  }

  it('renders maintenance report title and status correctly', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/broken ac unit/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/status:/i)).toBeInTheDocument()
    expect(screen.getByText(/priority:/i)).toBeInTheDocument()
  })

  it('displays facility info and reporter details', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/gym • main building/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/reported by jane smith/i)).toBeInTheDocument()
    expect(screen.getByText(/assigned to maintenance team/i)).toBeInTheDocument()
  })

  it('shows report description', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/ac unit in gym not functioning properly./i)).toBeInTheDocument()
    })
  })

  it('displays timeline with status updates', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    })

    expect(screen.getByText(/reported/i)).toBeInTheDocument()
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
  })

  it('displays comment section and allows adding new comment', async () => {
    setup()

    const commentField = await screen.findByPlaceholderText(/type your comment here.../i)
    fireEvent.change(commentField, { target: { value: 'Repaired compressor.' } })

    const addCommentButton = screen.getByRole('button', { name: /add comment/i })
    fireEvent.click(addCommentButton)

    await waitFor(() => {
      expect(require('@/services/api').api.post).toHaveBeenCalledWith('/maintenance/1/comments', {
        text: 'Repaired compressor.',
      })
    })
  })

  it('displays existing comments', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/initial inspection completed./i)).toBeInTheDocument()
    })

    expect(screen.getByText(/technician a/i)).toBeInTheDocument()
    expect(screen.getByText(/apr 2, 2025/i)).toBeInTheDocument()
  })

  it('opens and submits status update dialog', async () => {
    setup()

    const updateStatusButton = await screen.findByRole('button', { name: /update status/i })
    fireEvent.click(updateStatusButton)

    const statusSelect = screen.getByLabelText(/status/i)
    fireEvent.mouseDown(statusSelect)
    fireEvent.click(screen.getByText(/completed/i))

    const noteField = screen.getByLabelText(/notes/i)
    fireEvent.change(noteField, { target: { value: 'Issue resolved.' } })

    const submitButton = screen.getByRole('button', { name: /update status/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(require('@/services/api').api.put).toHaveBeenCalledWith('/maintenance/1/status', {
        status: 'completed',
        notes: 'Issue resolved.',
      })
    })
  })

  it('navigates to facility page when "View Facility" is clicked', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    setup()

    const viewFacilityButton = await screen.findByRole('button', { name: /view facility/i })
    fireEvent.click(viewFacilityButton)

    expect(navigateMock).toHaveBeenCalledWith('/admin/facilities/101', {
      state: { id: 101 },
    })
  })

  it('shows error message if fetching fails', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockRejectedValueOnce(new Error('API Error'))

    render(
      <MemoryRouter initialEntries={['/maintenance/999']}>
        <MaintenanceDetailsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load maintenance report/i)).toBeInTheDocument()
    })
  })

  it('reloads page on retry after error', async () => {
    jest.spyOn(window, 'location').mockImplementation({
      href: '',
      reload: jest.fn(),
    } as any)

    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockRejectedValueOnce(new Error())

    render(
      <MemoryRouter initialEntries={['/maintenance/1']}>
        <MaintenanceDetailsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load maintenance report/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    expect(window.location.reload).toHaveBeenCalled()
  })

  it('displays loading indicator while fetching data', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <MemoryRouter initialEntries={['/maintenance/1']}>
        <MaintenanceDetailsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('navigates to login when non-staff tries to update status', async () => {
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: {
        id: 202,
        name: 'Regular User',
        email: 'user@example.com',
        type: 'resident',
      },
    })

    setup()

    const updateStatusButton = await screen.findByRole('button', { name: /update status/i })
    fireEvent.click(updateStatusButton)

    expect(screen.getByText(/restricted access/i)).toBeInTheDocument()
  })

  it('shows staff actions only to staff users', async () => {
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: {
        id: 202,
        name: 'Regular User',
        email: 'user@example.com',
        type: 'resident',
      },
    })

    setup()

    await waitFor(() => {
      expect(screen.queryByText(/staff actions/i)).not.toBeInTheDocument()
    })
  })

  it('shows completed status chip in correct color', async () => {
    setup({
      ...mockReport,
      status: 'completed',
    })

    const statusChip = await screen.findByText(/completed/i)
    expect(statusChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
  })

  it('shows high priority chip in correct color', async () => {
    setup({
      ...mockReport,
      priority: 'high',
    })

    const priorityChip = await screen.findByText(/high/i)
    expect(priorityChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorError')
  })

  it('updates status to completed directly using "Mark as Completed"', async () => {
    setup()

    const markAsCompletedButton = await screen.findByRole('button', { name: /mark as completed/i })
    fireEvent.click(markAsCompletedButton)

    const submitButton = screen.getByRole('button', { name: /update status/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(require('@/services/api').api.put).toHaveBeenCalledWith('/maintenance/1/status', {
        status: 'completed',
        notes: '',
      })
    })
  })

  it('validates comment field before submission', async () => {
    setup()

    const emptyCommentField = await screen.findByPlaceholderText(/type your comment here.../i)
    fireEvent.change(emptyCommentField, { target: { value: '' } })

    const addCommentButton = screen.getByRole('button', { name: /add comment/i })
    fireEvent.click(addCommentButton)

    await waitFor(() => {
      expect(require('@/services/api').api.post).not.toHaveBeenCalled()
    })
  })

  it('shows no comments message when none exist', async () => {
    setup({
      ...mockReport,
      comments: [],
    })

    await waitFor(() => {
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument()
    })
  })

  it('navigates back to maintenance list', async () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    setup()

    const backButton = await screen.findByRole('button', { name: /back to maintenance reports/i })
    fireEvent.click(backButton)

    expect(navigateMock).toHaveBeenCalledWith('/maintenance')
  })

  it('shows timeline in alternate layout', async () => {
    setup()

    const timelineItems = await screen.findAllByTestId('timeline-item')
    expect(timelineItems.length).toBe(mockReport.history?.length || 0)
  })

  it('shows timeline with proper icons per status', async () => {
    setup()

    const timelineDots = await screen.findAllByTestId('timeline-dot')

    // Check icon classes for each status
    expect(timelineDots[0]).toContainHTML('FlagIcon')
    expect(timelineDots[1]).toContainHTML('BuildIcon')
  })

  it('does not show update status button if already completed', async () => {
    setup({
      ...mockReport,
      status: 'completed',
    })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /update status/i })).not.toBeInTheDocument()
    })
  })

  it('allows cancelling status update dialog', async () => {
    setup()

    const updateStatusButton = await screen.findByRole('button', { name: /update status/i })
    fireEvent.click(updateStatusButton)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText(/update maintenance status/i)).not.toBeInTheDocument()
    })
  })

  it('shows status options based on current status', async () => {
    setup({
      ...mockReport,
      status: 'in-progress',
    })

    const updateStatusButton = await screen.findByRole('button', { name: /update status/i })
    fireEvent.click(updateStatusButton)

    expect(screen.getByText(/reported/i)).toBeInTheDocument()
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
    expect(screen.getByText(/scheduled/i)).toBeInTheDocument()
    expect(screen.getByText(/completed/i)).toBeInTheDocument()
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument()
  })

  it('shows different buttons for staff vs. resident', async () => {
    setup()

    // As staff
    expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mark as completed/i })).toBeInTheDocument()

    // As resident
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: {
        id: 202,
        name: 'Regular User',
        email: 'user@example.com',
        type: 'resident',
      },
    })

    setup()

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /update status/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /mark as completed/i })).not.toBeInTheDocument()
    })
  })

  it('displays status history with notes and user names', async () => {
    setup()

    await waitFor(() => {
      expect(screen.getByText(/inspection started/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/technician a/i)).toBeInTheDocument()
    expect(screen.getByText(/reported/i)).toBeInTheDocument()
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
  })

  it('displays correct status color chips', async () => {
    setup()

    const statusChips = await screen.findAllByTestId('chip')

    expect(statusChips[0]).toHaveClass('MuiChip-colorInfo') // Reported
    expect(statusChips[1]).toHaveClass('MuiChip-colorWarning') // In Progress
  })

  it('shows "No maintenance report found" if ID is missing', async () => {
    jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: null })

    render(
      <MemoryRouter>
        <MaintenanceDetailsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/maintenance report not found/i)).toBeInTheDocument()
    })
  })

  it('disables update status button for cancelled/completed reports', async () => {
    setup({
      ...mockReport,
      status: 'completed',
    })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /update status/i })).not.toBeInTheDocument()
    })
  })
})