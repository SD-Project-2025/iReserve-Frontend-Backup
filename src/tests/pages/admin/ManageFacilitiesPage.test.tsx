import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ManageFacilitiesPage from './ManageFacilitiesPage';
import { api } from '@/services/api';

// Mock API server
const server = setupServer(
  rest.get('/facilities', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            facility_id: 1,
            name: 'Main Auditorium',
            type: 'Auditorium',
            location: 'Building A',
            capacity: 500,
            is_indoor: true,
            status: 'open',
            open_time: '08:00:00',
            close_time: '22:00:00'
          },
          {
            facility_id: 2,
            name: 'Swimming Pool',
            type: 'Pool',
            location: 'Building B',
            capacity: 50,
            is_indoor: false,
            status: 'maintenance',
            open_time: '06:00:00',
            close_time: '20:00:00'
          }
        ]
      })
    );
  }),
  rest.put('/facilities/:id', (req, res, ctx) => {
    return res(ctx.status(200));
  })
);

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock API module to track calls
jest.mock('@/services/api');

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe('ManageFacilitiesPage', () => {
  test('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  test('displays facilities after loading', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Main Auditorium')).toBeInTheDocument();
      expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/facilities', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load facilities. Please try again later.')).toBeInTheDocument();
    });
  });

  test('filters facilities by search term', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium'));

    const searchInput = screen.getByLabelText('Search facilities');
    fireEvent.change(searchInput, { target: { value: 'Auditorium' } });

    expect(screen.getByText('Main Auditorium')).toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
  });

  test('filters facilities by type', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium'));

    const typeFilter = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeFilter);
    fireEvent.click(screen.getByText('Auditorium'));

    expect(screen.getByText('Main Auditorium')).toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
  });

  test('filters facilities by status', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium'));

    const statusFilter = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusFilter);
    fireEvent.click(screen.getByText('Maintenance'));

    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.queryByText('Main Auditorium')).not.toBeInTheDocument();
  });

  test('navigates to create facility page', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Add Facility'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/facilities/create');
  });

  test('navigates to edit facility page', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium'));

    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/facilities/1/edit');
  });

  test('updates facility status', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium'));

    // Find and click the "Close" button for the first facility
    const closeButtons = screen.getAllByText('Close');
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/facilities/1', { status: 'closed' });
    });
  });

  test('displays correct status chips', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('open')).toHaveClass('MuiChip-colorSuccess');
      expect(screen.getByText('maintenance')).toHaveClass('MuiChip-colorWarning');
    });
  });

  test('shows indoor/outdoor labels correctly', async () => {
    render(
      <MemoryRouter>
        <ManageFacilitiesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Indoor')).toBeInTheDocument();
      expect(screen.getByText('Outdoor')).toBeInTheDocument();
    });
  });
});