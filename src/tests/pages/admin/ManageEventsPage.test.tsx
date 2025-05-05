import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ManageEventsPage from './ManageEventsPage' // Update path as needed
import { MemoryRouter } from 'react-router-dom'

// Mock API
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}))

// Mock MUI DataGrid
jest.mock('@mui/x-data-grid', () => ({
  DataGrid: ({ rows, columns }: any) => (
    <table>
      <tbody>
        {rows.map((row: any) => (
          <tr key={row.event_id}>
            {columns.map((col: any) => (
              <td key={col.field}>{row[col.field]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  GridColDef: jest.fn(),
}))

describe('ManageEventsPage Component', () => {
  const mockEvents = [
    {
      event_id: 1,
      title: 'Yoga Class',
      description: 'Morning yoga session',
      facility: {
        name: 'Gym',
        facility_id: 101,
      },
      start_date: '2025-04-01',
      end_date: '2025-04-01',
      start_time: '08:00',
      end_time: '09:00',
      status: 'upcoming',
      max_attendees: 30,
      current_attendees: 15,
      created_at: '2025-03-20T10:00:00Z',
    },
    {
      event_id: 2,
      title: 'Swim Meet',
      description: 'Community swim competition',
      facility: {
        name: 'Pool',
        facility_id: 102,
      },
      start_date: '2025-04-05',
      end_date: '2025-04-05',
      start_time: '10:00',
      end_time: '12:00',
      status: 'ongoing',
      max_attendees: 50,
      current_attendees: 40,
      created_at: '2025-03-22T11:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders page title and create button', () => {
    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/manage events/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
  })

  it('displays loading indicator when fetching data', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 100)))

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error message if fetching fails', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockRejectedValueOnce(new Error('API Error'))

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to load events/i)).toBeInTheDocument()
    })
  })

  it('displays event data correctly', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument()
      expect(screen.getByText('Swim Meet')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Gym')).toHaveLength(1)
    expect(screen.getAllByText('Pool')).toHaveLength(1)
  })

  it('filters events by search term', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    const searchInput = await screen.findByLabelText(/search events/i)

    fireEvent.change(searchInput, { target: { value: 'yoga' } })

    expect(screen.getByText('Yoga Class')).toBeInTheDocument()
    expect(screen.queryByText('Swim Meet')).not.toBeInTheDocument()
  })

  it('filters events by status', async () => {
    const apiGetMock = require('@/services/api').api.get
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    const statusSelect = await screen.findByLabelText(/status/i)

    fireEvent.mouseDown(statusSelect)
    fireEvent.click(screen.getByText(/ongoing/i))

    expect(screen.getByText('Swim Meet')).toBeInTheDocument()
    expect(screen.queryByText('Yoga Class')).not.toBeInTheDocument()
  })

  it('opens delete dialog and confirms deletion', async () => {
    const apiGetMock = require('@/services/api').api.get
    const apiDeleteMock = require('@/services/api').api.delete
    apiGetMock.mockResolvedValueOnce({ data: { data: mockEvents } })
    apiDeleteMock.mockResolvedValueOnce({})

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    const deleteButton = await screen.findByLabelText(/delete/i)
    fireEvent.click(deleteButton)

    expect(screen.getByText(/are you sure you want to delete this event/i)).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(apiDeleteMock).toHaveBeenCalledWith('/events/2')
    })
  })

  it('navigates to create event page on button click', () => {
    const navigateMock = jest.fn()
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigateMock)

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /create event/i }))
    expect(navigateMock).toHaveBeenCalledWith('/admin/events/create')
  })
})