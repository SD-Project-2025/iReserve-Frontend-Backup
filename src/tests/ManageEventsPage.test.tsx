import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ManageEventsPage from '@/pages/admin/ManageEventsPage';
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
          <div key={row.event_id} data-testid={`row-${row.event_id}`}>
            {props.columns.map((col: any) => (
              <div key={col.field}>
                {col.field === 'actions' ? (
                  <div data-testid={`actions-${row.event_id}`}>
                    {/* Render mock actions */}
                    <button onClick={() => props.onRowClick && props.onRowClick({ row })}>
                      View
                    </button>
                    <button onClick={() => props.onEditClick && props.onEditClick(row.event_id)}>
                      Edit
                    </button>
                    <button onClick={() => props.onDeleteClick && props.onDeleteClick(row.event_id)}>
                      Delete
                    </button>
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

describe('ManageEventsPage', () => {
  const mockEvents = [
    {
      event_id: 1,
      title: 'Tech Conference',
      description: 'Annual technology conference',
      facility: {
        name: 'Grand Ballroom',
        facility_id: 1,
      },
      start_date: '2023-06-15',
      end_date: '2023-06-17',
      start_time: '09:00',
      end_time: '18:00',
      status: 'upcoming',
      max_attendees: 500,
      current_attendees: 250,
      created_at: '2023-01-01',
    },
    {
      event_id: 2,
      title: 'Workshop',
      description: 'React training workshop',
      facility: {
        name: 'Training Room 1',
        facility_id: 2,
      },
      start_date: '2023-05-10',
      end_date: '2023-05-10',
      start_time: '10:00',
      end_time: '16:00',
      status: 'ongoing',
      max_attendees: 30,
      current_attendees: 28,
      created_at: '2023-03-15',
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock API response
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockEvents,
      },
    });
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  test('renders events after loading', async () => {
    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Events')).toBeInTheDocument();
      expect(screen.getByText('Tech Conference')).toBeInTheDocument();
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });
  });

  test('displays error when API fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to load events. Please try again later.')).toBeInTheDocument();
    });
  });

  test('filters events by search term', async () => {
    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByLabelText('Search events');
      fireEvent.change(searchInput, { target: { value: 'Conference' } });

      expect(screen.getByText('Tech Conference')).toBeInTheDocument();
      expect(screen.queryByText('Workshop')).not.toBeInTheDocument();
    });
  });

  test('filters events by status', async () => {
    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusFilter);
      const options = screen.getAllByRole('option');
      fireEvent.click(options[2]); // Select "Ongoing"

      expect(screen.queryByText('Tech Conference')).not.toBeInTheDocument();
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });
  });

  test('filters events by facility', async () => {
    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const facilityFilter = screen.getByLabelText('Facility');
      fireEvent.mouseDown(facilityFilter);
      const options = screen.getAllByRole('option');
      fireEvent.click(options[2]); // Select "Training Room 1"

      expect(screen.queryByText('Tech Conference')).not.toBeInTheDocument();
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });
  });

  test('opens delete confirmation dialog', async () => {
    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Delete Event')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this event? This action cannot be undone.')).toBeInTheDocument();
    });
  });

  test('deletes event', async () => {
    (api.delete as jest.Mock).mockResolvedValue({});
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockEvents.filter(e => e.event_id !== 1),
      },
    });

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(async () => {
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/events/1');
      });
    });
  });

  test('navigates to view event', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/events/1');
    });
  });

  test('navigates to edit event', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/events/1/edit');
    });
  });

  test('navigates to create event', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <MemoryRouter>
        <ManageEventsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const createButton = screen.getByText('Create Event');
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/events/create');
    });
  });
});