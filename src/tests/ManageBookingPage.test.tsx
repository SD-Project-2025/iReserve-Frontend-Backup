import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ManageBookingsPage from '@/pages/admin/ManageBookingsPage';
import { api } from '@/services/api';

// Mock the API
jest.mock('@/services/api');

// Mock the DataGrid component to make testing easier
jest.mock('@mui/x-data-grid', () => ({
  DataGrid: (props: any) => {
    // Simulate DataGrid behavior for testing
    return (
      <div data-testid="datagrid">
        {props.rows.map((row: any) => (
          <div key={row.booking_id} data-testid={`row-${row.booking_id}`}>
            {props.columns.map((col: any) => (
              <div key={col.field}>
                {col.field === 'actions' ? (
                  <div data-testid={`actions-${row.booking_id}`}>
                    {/* Render mock actions */}
                    <button onClick={() => props.onRowClick && props.onRowClick({ row })}>
                      View
                    </button>
                    {(row.status === 'pending' || row.status === 'rejected') && (
                      <button onClick={() => props.onActionClick && props.onActionClick(row.booking_id, 'approve')}>
                        Approve
                      </button>
                    )}
                    {(row.status === 'pending' || row.status === 'approved') && (
                      <button onClick={() => props.onActionClick && props.onActionClick(row.booking_id, 'reject')}>
                        Reject
                      </button>
                    )}
                  </div>
                ) : (
                  col.valueGetter ? col.valueGetter({ row }) : row[col.field]
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

describe('ManageBookingsPage', () => {
  const mockBookings = [
    {
      booking_id: 1,
      facility_id: 1,
      resident_id: 1,
      date: '2023-01-01',
      start_time: '10:00',
      end_time: '12:00',
      status: 'pending',
      purpose: 'Meeting',
      attendees: 5,
      created_at: '2022-12-25',
      approved_by: null,
      approval_date: null,
      Facility: {
        facility_id: 1,
        name: 'Conference Room',
        type: 'Room',
        location: 'Building A',
      },
      Resident: {
        resident_id: 1,
      },
      approver: null,
    },
    {
      booking_id: 2,
      facility_id: 2,
      resident_id: 2,
      date: '2023-01-02',
      start_time: '14:00',
      end_time: '16:00',
      status: 'approved',
      purpose: 'Training',
      attendees: 10,
      created_at: '2022-12-26',
      approved_by: 1,
      approval_date: '2022-12-27',
      Facility: {
        facility_id: 2,
        name: 'Training Room',
        type: 'Room',
        location: 'Building B',
      },
      Resident: {
        resident_id: 2,
      },
      approver: {
        staff_id: 1,
        employee_id: 'EMP001',
      },
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock API response
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockBookings,
      },
    });
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  test('renders bookings after loading', async () => {
    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Bookings')).toBeInTheDocument();
      expect(screen.getByText('Conference Room')).toBeInTheDocument();
      expect(screen.getByText('Training Room')).toBeInTheDocument();
    });
  });

  test('displays error when API fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to load bookings. Please try again later.')).toBeInTheDocument();
    });
  });

  test('filters bookings by search term', async () => {
    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByLabelText('Search bookings');
      fireEvent.change(searchInput, { target: { value: 'Meeting' } });

      expect(screen.getByText('Conference Room')).toBeInTheDocument();
      expect(screen.queryByText('Training Room')).not.toBeInTheDocument();
    });
  });

  test('filters bookings by status', async () => {
    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusFilter);
      const options = screen.getAllByRole('option');
      fireEvent.click(options[2]); // Select "Approved"

      expect(screen.queryByText('Conference Room')).not.toBeInTheDocument();
      expect(screen.getByText('Training Room')).toBeInTheDocument();
    });
  });

  test('filters bookings by facility', async () => {
    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const facilityFilter = screen.getByLabelText('Facility');
      fireEvent.mouseDown(facilityFilter);
      const options = screen.getAllByRole('option');
      fireEvent.click(options[2]); // Select "Training Room"

      expect(screen.queryByText('Conference Room')).not.toBeInTheDocument();
      expect(screen.getByText('Training Room')).toBeInTheDocument();
    });
  });

  test('opens approve confirmation dialog', async () => {
    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      expect(screen.getByText('Approve Booking')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to approve this booking?')).toBeInTheDocument();
    });
  });

  test('opens reject confirmation dialog', async () => {
    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);

      expect(screen.getByText('Reject Booking')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to reject this booking?')).toBeInTheDocument();
    });
  });

  test('approves booking', async () => {
    (api.put as jest.Mock).mockResolvedValue({});
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockBookings.map(b => 
          b.booking_id === 1 ? {...b, status: 'approved'} : b
        ),
      },
    });

    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(async () => {
      const approveButtons = screen.getAllByText('Approve');
      fireEvent.click(approveButtons[0]);

      const confirmButton = screen.getByText('Approve');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/bookings/1/status', { status: 'approved' });
      });
    });
  });

  test('rejects booking', async () => {
    (api.put as jest.Mock).mockResolvedValue({});
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockBookings.map(b => 
          b.booking_id === 1 ? {...b, status: 'rejected'} : b
        ),
      },
    });

    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(async () => {
      const rejectButtons = screen.getAllByText('Reject');
      fireEvent.click(rejectButtons[0]);

      const confirmButton = screen.getByText('Reject');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/bookings/1/status', { status: 'rejected' });
      });
    });
  });

  test('navigates to view booking', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <MemoryRouter>
        <ManageBookingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/bookings/1');
    });
  });
});