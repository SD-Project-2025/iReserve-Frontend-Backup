
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { rest, RestContext, RestRequest } from 'msw';
import { setupServer } from 'msw/node';
import CreateMaintenancePage from '@/pages/maintenance/CreateMaintenancePage';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Mock API server
const server = setupServer(
  rest.get('/facilities', (res: RestRequest, ctx: RestContext) => {
    return res(
      ctx.json({
        data: [
          {
            facility_id: 1,
            name: 'Main Auditorium',
            type: 'Auditorium',
            status: 'open'
          },
          {
            facility_id: 2,
            name: 'Swimming Pool',
            type: 'Pool',
            status: 'open'
          }
        ]
      })
    );
  }),
  rest.get('/auth/me', ( res: RestRequest, ctx: RestContext) => {
    return res(
      ctx.json({
        data: {
          data: {
            profile: {
              resident_id: 123,
              staff_id: 456
            }
          }
        }
      })
    );
  }),
  rest.post('/maintenance', ( res: RestRequest, ctx: RestContext) => {
    return res(ctx.status(201));
  })
);

// Mock hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('@/contexts/AuthContext');
jest.mock('@/services/api');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockApi = api as jest.Mocked<typeof api>;

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe('CreateMaintenancePage', () => {
  beforeEach(() => {
    // Mock useLocation with state
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      state: null
    });
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  test('displays facilities after loading', async () => {
    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Main Auditorium (Auditorium)')).toBeInTheDocument();
      expect(screen.getByText('Swimming Pool (Pool)')).toBeInTheDocument();
    });
  });

  test('handles API error when fetching facilities', async () => {
    server.use(
      rest.get('/facilities', (res: RestRequest, ctx: RestContext) => {
        return res(ctx.status(500));
      })
    );

    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load facilities. Please try again later.')).toBeInTheDocument();
    });
  });

  test('validates form fields', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    // Try to submit empty form
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Please select a facility')).toBeInTheDocument();
      expect(screen.getByText('Please enter a title')).toBeInTheDocument();
      expect(screen.getByText('Please enter a description')).toBeInTheDocument();
    });

    // Test title validation
    fireEvent.change(screen.getByLabelText('Issue Title'), { target: { value: 'A' } });
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 5 characters')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Issue Title'), { target: { value: 'A'.repeat(101) } });
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Title must be under 100 characters')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Issue Title'), { target: { value: 'Invalid@Title' } });
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Title contains invalid characters')).toBeInTheDocument();
    });

    // Test description validation
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Short' } });
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
    });
  });

  test('submits form successfully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    // Fill out the form
    fireEvent.mouseDown(screen.getByLabelText('Facility'));
    fireEvent.click(screen.getByText('Main Auditorium (Auditorium)'));
    fireEvent.change(screen.getByLabelText('Issue Title'), { target: { value: 'Broken Light' } });
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'The light in the hallway is flickering and needs replacement' } 
    });
    fireEvent.mouseDown(screen.getByLabelText('Priority'));
    fireEvent.click(screen.getByText('Medium'));

    // Submit the form
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/maintenance', {
        facility_id: 1,
        title: 'Broken Light',
        description: 'The light in the hallway is flickering and needs replacement',
        priority: 'medium',
        userType: 'resident',
        user_id: 123
      });
    });

    expect(screen.getByText('Maintenance report submitted successfully!')).toBeInTheDocument();
  });

  test('handles submission error', async () => {
    server.use(
      rest.post('/maintenance', (res: RestRequest, ctx: RestContext) => {
        return res(
          ctx.status(400),
          ctx.json({ message: 'Facility not available for maintenance' })
        );
      })
    );

    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    // Fill out the form
    fireEvent.mouseDown(screen.getByLabelText('Facility'));
    fireEvent.click(screen.getByText('Main Auditorium (Auditorium)'));
    fireEvent.change(screen.getByLabelText('Issue Title'), { target: { value: 'Broken Light' } });
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'The light in the hallway is flickering and needs replacement' } 
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Facility not available for maintenance')).toBeInTheDocument();
    });
  });

  test('pre-fills facility if passed in location state', async () => {
    // Mock useLocation with state
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      state: { facilityId: 2 }
    });

    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Swimming Pool (Pool)')).toBeInTheDocument();
    });
  });

  test('sets correct user_id based on user type', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'staff' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <CreateMaintenancePage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    // Fill out the form
    fireEvent.mouseDown(screen.getByLabelText('Facility'));
    fireEvent.click(screen.getByText('Main Auditorium (Auditorium)'));
    fireEvent.change(screen.getByLabelText('Issue Title'), { target: { value: 'Broken Light' } });
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'The light in the hallway is flickering and needs replacement' } 
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/maintenance', expect.objectContaining({
        userType: 'staff',
        user_id: 456
      }));
    });
  });
});