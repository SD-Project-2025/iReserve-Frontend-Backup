import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ManageMaintenancePage from './ManageMaintenancePage';
import { api } from '@/services/api';

// Mock API server
const server = setupServer(
  rest.get('/maintenance', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            report_id: 1,
            title: 'Leaking Pipe',
            description: 'Pipe in restroom is leaking',
            facility: {
              name: 'Main Building',
              facility_id: 1
            },
            user: {
              name: 'John Doe',
              user_id: 1
            },
            reported_date: '2023-06-15T10:30:00Z',
            status: 'reported',
            priority: 'high'
          },
          {
            report_id: 2,
            title: 'Broken AC',
            description: 'AC not cooling properly',
            facility: {
              name: 'Conference Room',
              facility_id: 2
            },
            user: {
              name: 'Jane Smith',
              user_id: 2
            },
            reported_date: '2023-06-16T14:45:00Z',
            status: 'in-progress',
            priority: 'medium'
          }
        ]
      })
    );
  }),
  rest.put('/maintenance/:id/status', (req, res, ctx) => {
    return res(ctx.status(200));
  })
);

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe('ManageMaintenancePage', () => {
  test('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  test('displays maintenance reports after loading', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/maintenance', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load maintenance reports. Please try again later.')).toBeInTheDocument();
    });
  });

  test('filters reports by search term', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Leaking Pipe'));

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: 'Pipe' } });

    expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
    expect(screen.queryByText('Broken AC')).not.toBeInTheDocument();
  });

  test('filters reports by status', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Leaking Pipe'));

    const statusFilter = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusFilter);
    fireEvent.click(screen.getByText('In Progress'));

    expect(screen.getByText('Broken AC')).toBeInTheDocument();
    expect(screen.queryByText('Leaking Pipe')).not.toBeInTheDocument();
  });

  test('filters reports by priority', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Leaking Pipe'));

    const priorityFilter = screen.getByLabelText('Priority');
    fireEvent.mouseDown(priorityFilter);
    fireEvent.click(screen.getByText('High'));

    expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
    expect(screen.queryByText('Broken AC')).not.toBeInTheDocument();
  });

  test('filters reports by facility', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Leaking Pipe'));

    const facilityFilter = screen.getByLabelText('Facility');
    fireEvent.mouseDown(facilityFilter);
    fireEvent.click(screen.getByText('Conference Room'));

    expect(screen.getByText('Broken AC')).toBeInTheDocument();
    expect(screen.queryByText('Leaking Pipe')).not.toBeInTheDocument();
  });

  test('navigates to view report page', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Leaking Pipe'));

    fireEvent.click(screen.getAllByText('View')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/maintenance/1');
  });

  test('opens status update dialog', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Leaking Pipe'));

    fireEvent.click(screen.getByText('Start Work'));
    expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to start work on this maintenance issue?')).toBeInTheDocument();
  });

  test('updates report status', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Leaking Pipe'));

    // Click "Start Work" button
    fireEvent.click(screen.getByText('Start Work'));
    // Click "Confirm" button in dialog
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/maintenance/1/status', { status: 'in-progress' });
    });
  });

  test('displays correct status and priority chips', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Reported status (info color)
      expect(screen.getByText('reported')).toHaveClass('MuiChip-colorInfo');
      // High priority (error color)
      expect(screen.getByText('high')).toHaveClass('MuiChip-colorError');
      // In-progress status (warning color)
      expect(screen.getByText('in-progress')).toHaveClass('MuiChip-colorWarning');
      // Medium priority (warning color)
      expect(screen.getByText('medium')).toHaveClass('MuiChip-colorWarning');
    });
  });

  test('shows appropriate action buttons based on status', async () => {
    render(
      <MemoryRouter>
        <ManageMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Reported status should show "Start Work" button
      expect(screen.getByText('Start Work')).toBeInTheDocument();
      // In-progress status should show "Schedule" and "Complete" buttons
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });
});