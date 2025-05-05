
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { , RestContext, RestRequest } from 'msw';
import { setupServer } from 'msw/node';
import EventDetailsPage from '@/pages/events/EventDetailsPage';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Mock API server
const server = setupServer(
  rest.get('/events/:id', (res: RestRequest, ctx: RestContext) => {
    return res(
      ctx.json({
        data: {
          event_id: 1,
          title: 'Community Picnic',
          description: 'Annual community picnic event',
          facility: {
            facility_id: 1,
            name: 'Community Park',
            type: 'Outdoor',
            location: '123 Main St',
            capacity: 100
          },
          start_date: '2023-07-15',
          end_date: '2023-07-15',
          start_time: '10:00:00',
          end_time: '16:00:00',
          status: 'upcoming',
          image_url: '/picnic.jpg',
          capacity: 100,
          registrations: 75,
          is_public: true,
          registration_deadline: '2023-07-10',
          fee: 10,
          organizer: {
            staff_id: 1,
            employee_id: 'EMP001',
            position: 'Event Coordinator'
          },
          facilityLoc: {
            facility_id: 1,
            name: 'Community Park',
            location: '123 Main St'
          }
        }
      })
    );
  }),
  rest.get('/auth/me', (res: RestRequest, ctx: RestContext) => {
    return res(
      ctx.json({
        data: {
          profile: {
            resident_id: 123
          }
        }
      })
    );
  }),
  rest.get('/events/:id/status/:residentId', (res: RestRequest, ctx: RestContext) => {
    return res(
      ctx.json({
        data: {
          status: 'registered',
          paymentStatus: 'paid',
          notes: null,
          registrationDate: '2023-06-01'
        }
      })
    );
  }),
  rest.post('/events/:id/register', (res: RestRequest, ctx: RestContext) => {
    return res(ctx.status(201));
  }),
  rest.put('/events/:id/cancel-registration', (res: RestRequest, ctx: RestContext) => {
    return res(ctx.status(200));
  }),
  rest.delete('/events/:id', (res: RestRequest, ctx: RestContext) => {
    return res(ctx.status(200));
  })
);

// Mock hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
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

describe('EventDetailsPage', () => {
  beforeEach(() => {
    // Mock useParams to return our test event ID
    jest.spyOn(require('react-router-dom'), 'useParams').mockReturnValue({ id: '1' });
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  test('displays event details after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Community Picnic')).toBeInTheDocument();
      expect(screen.getByText('Annual community picnic event')).toBeInTheDocument();
      expect(screen.getByText('Community Park • 123 Main St')).toBeInTheDocument();
      expect(screen.getByText('upcoming')).toBeInTheDocument();
      expect(screen.getByText('75 / 100 attendees')).toBeInTheDocument();
    });
  });

  test('shows error when event fetch fails', async () => {
    server.use(
      rest.get('/events/:id', (res: RestRequest, ctx: RestContext) => {
        return res(ctx.status(404));
      })
    );

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load event details')).toBeInTheDocument();
    });
  });

  test('shows registration status for logged in resident', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('You are registered for this event')).toBeInTheDocument();
    });
  });

  test('shows sign in prompt for unauthenticated users', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Please sign in to view your registration status')).toBeInTheDocument();
      expect(screen.getByText('Sign in to register')).toBeInTheDocument();
    });
  });

  test('shows staff message for staff users', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'staff' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Staff members cannot register for events')).toBeInTheDocument();
      expect(screen.getByText('Staff Actions')).toBeInTheDocument();
    });
  });

  test('handles registration flow', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    // Mock status check to return not registered
    server.use(
      rest.get('/events/:id/status/:residentId', (res: RestRequest, ctx: RestContext) => {
        return res(
          ctx.status(404),
          ctx.json({ message: 'Not registered' })
        );
      })
    );

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('You are not registered for this event')).toBeInTheDocument();
    });

    // Click register button
    fireEvent.click(screen.getByText('Register for Event'));

    // Verify dialog opens
    await waitFor(() => {
      expect(screen.getByText('Confirm Registration')).toBeInTheDocument();
      expect(screen.getByText('Note: This event has a fee of $10.00 that will need to be paid')).toBeInTheDocument();
    });

    // Click confirm button
    fireEvent.click(screen.getByText('Register'));

    // Verify API call was made
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/events/1/register');
    });
  });

  test('handles registration cancellation', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('You are registered for this event')).toBeInTheDocument();
    });

    // Click cancel registration button
    fireEvent.click(screen.getByText('Cancel Registration'));

    // Verify dialog opens
    await waitFor(() => {
      expect(screen.getByText('Cancel Registration')).toBeInTheDocument();
    });

    // Click confirm button
    fireEvent.click(screen.getByText('Cancel Registration'));

    // Verify API call was made
    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/events/1/cancel-registration');
    });
  });

  test('handles event cancellation by staff', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, type: 'staff' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cancel Event')).toBeInTheDocument();
    });

    // Click cancel event button
    fireEvent.click(screen.getByText('Cancel Event'));

    // Verify API call was made
    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith('/events/1');
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test('shows fully booked message when event is full', async () => {
    // Mock event with full capacity
    server.use(
      rest.get('/events/:id', ( res: RestRequest, ctx: RestContext) => {
        return res(
          ctx.json({
            data: {
              event_id: 1,
              title: 'Community Picnic',
              description: 'Annual community picnic event',
              facility: {
                facility_id: 1,
                name: 'Community Park',
                type: 'Outdoor',
                location: '123 Main St',
                capacity: 100
              },
              start_date: '2023-07-15',
              end_date: '2023-07-15',
              start_time: '10:00:00',
              end_time: '16:00:00',
              status: 'upcoming',
              image_url: '/picnic.jpg',
              capacity: 100,
              registrations: 100,
              is_public: true,
              facilityLoc: {
                facility_id: 1,
                name: 'Community Park',
                location: '123 Main St'
              }
            }
          })
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
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('This event is fully booked.')).toBeInTheDocument();
    });
  });

  test('shows appropriate messages for completed/cancelled events', async () => {
    // Mock completed event
    server.use(
      rest.get('/events/:id', ( res: RestRequest, ctx: RestContext) => {
        return res(
          ctx.json({
            data: {
              event_id: 1,
              title: 'Community Picnic',
              description: 'Annual community picnic event',
              facility: {
                facility_id: 1,
                name: 'Community Park',
                type: 'Outdoor',
                location: '123 Main St',
                capacity: 100
              },
              start_date: '2023-07-15',
              end_date: '2023-07-15',
              start_time: '10:00:00',
              end_time: '16:00:00',
              status: 'completed',
              image_url: '/picnic.jpg',
              capacity: 100,
              registrations: 75,
              is_public: true,
              facilityLoc: {
                facility_id: 1,
                name: 'Community Park',
                location: '123 Main St'
              }
            }
          })
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
      <MemoryRouter initialEntries={['/events/1']}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('This event has already taken place')).toBeInTheDocument();
    });
  });
});