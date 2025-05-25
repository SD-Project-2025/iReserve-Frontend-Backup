import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardPage from '../../../pages/dashboard/DashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock child components
jest.mock('@/pages/resident/ResidentDashboard', () => () => <div>Resident Dashboard</div>);
jest.mock('@/pages/staff/StaffDashboard', () => () => <div>Staff Dashboard</div>);
jest.mock('@/pages/admin/AdminDashboard', () => () => <div>Admin Dashboard</div>);

describe('DashboardPage', () => {
  const mockResidentUser = {
    id: 'user-1',
    name: 'John Resident',
    email: 'john@example.com',
    type: 'resident',
  };

  const mockStaffUser = {
    id: 'user-2',
    name: 'Jane Staff',
    email: 'jane@example.com',
    type: 'staff',
  };

  const mockAdminUser = {
    id: 'user-3',
    name: 'Admin User',
    email: 'admin@example.com',
    type: 'staff',
    isAdmin: true,
  };

  const mockBookings = [
    {
      booking_id: 1,
      facility_name: 'Tennis Court',
      date: '2023-06-15',
      start_time: '10:00',
      end_time: '11:00',
      status: 'confirmed',
    },
  ];

  const mockFacilities = [
    {
      facility_id: 1,
      name: 'Tennis Court',
      type: 'sports',
      status: 'available',
    },
  ];

  const mockEvents = [
    {
      event_id: 1,
      title: 'Tennis Tournament',
      start_date: '2023-06-20',
      end_date: '2023-06-22',
    },
  ];

  const mockNotifications = [
    {
      notification_id: 1,
      title: 'New Booking',
      message: 'Your booking has been confirmed',
      type: 'booking',
      created_at: '2023-06-10T10:00:00Z',
      read: false,
    },
  ];

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock API responses
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/bookings/my-bookings') {
        return Promise.resolve({ data: { data: mockBookings } });
      }
      if (url === '/facilities') {
        return Promise.resolve({ data: { data: mockFacilities } });
      }
      if (url === '/events') {
        return Promise.resolve({ data: { data: mockEvents } });
      }
      if (url === '/notifications') {
        return Promise.resolve({ data: { data: mockNotifications } });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = (user = mockResidentUser, loading = false, isAuthenticated = true) => {
    (useAuth as jest.Mock).mockReturnValue({
      user,
      loading,
      isAuthenticated,
      logout: jest.fn(),
    });

    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('redirects to login when not authenticated', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    renderDashboard(mockResidentUser, false, false);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows loading spinner when auth is loading', () => {
    renderDashboard(mockResidentUser, true);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders resident dashboard for resident users', async () => {
    renderDashboard(mockResidentUser);
    await waitFor(() => {
      expect(screen.getByText('Resident Dashboard')).toBeInTheDocument();
    });
  });

  it('renders staff dashboard for staff users', async () => {
    renderDashboard(mockStaffUser);
    await waitFor(() => {
      expect(screen.getByText('Staff Dashboard')).toBeInTheDocument();
    });
  });

  it('renders admin dashboard for admin users in dev mode', async () => {
    // Set dev mode and admin flag
    process.env.NODE_ENV = 'development';
    localStorage.setItem('testAdminDashboard', 'true');
    
    renderDashboard(mockAdminUser);
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
    
    // Cleanup
    process.env.NODE_ENV = 'test';
  });

  it('fetches dashboard data on mount', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/bookings/my-bookings');
      expect(api.get).toHaveBeenCalledWith('/facilities');
      expect(api.get).toHaveBeenCalledWith('/events');
      expect(api.get).toHaveBeenCalledWith('/notifications');
    });
  });

  it('handles API errors gracefully', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    renderDashboard();
    
    await waitFor(() => {
      // In a real implementation, you might want to add error handling UI
      // and test for its presence here
      expect(screen.getByText('Resident Dashboard')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', async () => {
    let resolveBookings: any;
    const bookingsPromise = new Promise((resolve) => {
      resolveBookings = resolve;
    });
    
    (api.get as jest.Mock).mockImplementationOnce(() => bookingsPromise);
    
    renderDashboard();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    resolveBookings({ data: { data: mockBookings } });
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});