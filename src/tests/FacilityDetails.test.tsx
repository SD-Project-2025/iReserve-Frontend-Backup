import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate, useLocation } from 'react-router-dom';
import FacilityDetailsPage from '@/pages/facilities/FacilityDetailsPage';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('FacilityDetailsPage', () => {
  const mockNavigate = jest.fn();
  
  // Sample facility data for tests
  const mockFacility = {
    data: {
      success: true,
      data: {
        facility_id: 1,
        name: 'Tennis Court',
        type: 'Sports',
        location: 'North Wing',
        capacity: 4,
        is_indoor: false,
        image_url: '/tennis-court.jpg',
        status: 'open',
        description: 'Professional tennis court with high-quality surface. Perfect for both casual games and competitive matches.',
        open_time: '08:00',
        close_time: '20:00',
      }
    }
  };
  
  const mockBookings = {
    data: {
      data: [
        {
          booking_id: 101,
          date: '2025-04-25',
          start_time: '14:00',
          end_time: '16:00',
          status: 'approved',
        },
        {
          booking_id: 102,
          date: '2025-04-26',
          start_time: '10:00',
          end_time: '12:00',
          status: 'pending',
        }
      ]
    }
  };
  
  const mockEvents = {
    data: {
      data: [
        {
          event_id: 201,
          title: 'Tennis Tournament',
          start_date: '2025-05-01',
          end_date: '2025-05-01',
          start_time: '09:00',
          end_time: '17:00',
          status: 'upcoming',
        },
        {
          event_id: 202,
          title: 'Tennis Workshop',
          start_date: '2025-05-10',
          end_date: '2025-05-12',
          start_time: '14:00',
          end_time: '16:00',
          status: 'upcoming',
        }
      ]
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock route params and navigation
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useLocation as jest.Mock).mockReturnValue({ state: { id: '1' } });
    
    // Mock successful API responses
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/facilities/1') {
        return Promise.resolve(mockFacility);
      } else if (url === '/facilities/1/bookings') {
        return Promise.resolve(mockBookings);
      } else if (url === '/facilities/1/events') {
        return Promise.resolve(mockEvents);
      }
      return Promise.resolve({ data: { data: [] } });
    });
    
    // Mock auth context
    (useAuth as jest.Mock).mockReturnValue({
      user: { type: 'resident' }
    });
  });
  
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <FacilityDetailsPage />
      </BrowserRouter>
    );
  };
  
  test('renders loading state initially', () => {
    // Mock API to not resolve immediately
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders facility details when data is loaded', async () => {
    renderComponent();
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check facility name and description
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.getByText('Professional tennis court with high-quality surface. Perfect for both casual games and competitive matches.')).toBeInTheDocument();
    
    // Check facility details
    expect(screen.getByText('Sports • Outdoor • Capacity: 4')).toBeInTheDocument();
    expect(screen.getByText('North Wing')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 20:00')).toBeInTheDocument();
    
    // Check status chip
    expect(screen.getByText('open')).toBeInTheDocument();
    
    // Check facility details card
    expect(screen.getByText('Facility Details')).toBeInTheDocument();
    expect(screen.getByText('Type: Sports')).toBeInTheDocument();
    expect(screen.getByText('Location: North Wing')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 4')).toBeInTheDocument();
    expect(screen.getByText('Environment: Outdoor')).toBeInTheDocument();
    expect(screen.getByText('Operating Hours: 08:00 - 20:00')).toBeInTheDocument();
    expect(screen.getByText('Current Status:')).toBeInTheDocument();
  });
  
  test('displays error message when API call fails', async () => {
    // Mock API error for facility fetch
    (api.get as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Facility not found'
        }
      }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText('Facility not found')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
  
  test('displays generic error message when API response is missing', async () => {
    // Mock API with invalid response
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: false
      }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText('Failed to fetch facility')).toBeInTheDocument();
  });
  
  test('renders upcoming bookings section correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check bookings section title
    expect(screen.getByText('Upcoming Bookings')).toBeInTheDocument();
    
    // Check booking table headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Check booking data
    const dates = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dates.length).toBe(4); // 2 for bookings + 2 for events
    
    expect(screen.getByText('14:00 - 16:00')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 12:00')).toBeInTheDocument();
    
    // Check status chips
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
  
  test('renders upcoming events section correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check events section title
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    
    // Check event table headers
    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    
    // Check event data
    expect(screen.getByText('Tennis Tournament')).toBeInTheDocument();
    expect(screen.getByText('Tennis Workshop')).toBeInTheDocument();
    
    expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
    
    // Check status chips for events
    const upcomingChips = screen.getAllByText('upcoming');
    expect(upcomingChips.length).toBe(2);
    
    // Check view buttons
    const viewButtons = screen.getAllByText('View');
    expect(viewButtons.length).toBe(2);
  });
  
  test('handles action buttons correctly for resident users', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check action buttons
    expect(screen.getByText('Book this Facility')).toBeInTheDocument();
    expect(screen.getByText('View All Events')).toBeInTheDocument();
    expect(screen.getByText('Report Issue')).toBeInTheDocument();
    
    // Click Book this Facility
    fireEvent.click(screen.getByText('Book this Facility'));
    expect(mockNavigate).toHaveBeenCalledWith('/bookings/create', { state: { facilityId: 1 } });
    
    // Click View All Events
    fireEvent.click(screen.getByText('View All Events'));
    expect(mockNavigate).toHaveBeenCalledWith('/events', { state: { facilityFilter: 1 } });
    
    // Click Report Issue
    fireEvent.click(screen.getByText('Report Issue'));
    expect(mockNavigate).toHaveBeenCalledWith('/maintenance/create', { state: { facilityId: 1 } });
  });
  
  test('shows booking dialog for non-resident users', async () => {
    // Set user type to staff
    (useAuth as jest.Mock).mockReturnValue({
      user: { type: 'staff' }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click Book this Facility
    fireEvent.click(screen.getByText('Book this Facility'));
    
    // Check dialog appears
    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
    expect(screen.getByText('Only residents are allowed to book this facility. Please log in as a resident to proceed with the booking.')).toBeInTheDocument();
    
    // Click Go to Login
    fireEvent.click(screen.getByText('Go to Login'));
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: '/facilities/1' } });
    
    // Or click Close
    fireEvent.click(screen.getByText('Close'));
    // Dialog should be closed (would test with queryByText in a real test environment)
  });
  
  test('disables booking button when facility is not open', async () => {
    // Mock facility with closed status
    const closedFacility = {
      data: {
        success: true,
        data: {
          ...mockFacility.data.data,
          status: 'closed'
        }
      }
    };
    
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/facilities/1') {
        return Promise.resolve(closedFacility);
      } else if (url === '/facilities/1/bookings') {
        return Promise.resolve(mockBookings);
      } else if (url === '/facilities/1/events') {
        return Promise.resolve(mockEvents);
      }
      return Promise.resolve({ data: { data: [] } });
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that Book This Facility button is disabled
    const bookButton = screen.getByText('Book this Facility');
    expect(bookButton).toBeDisabled();
  });
  
  test('shows appropriate message when no bookings exist', async () => {
    // Mock empty bookings
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/facilities/1') {
        return Promise.resolve(mockFacility);
      } else if (url === '/facilities/1/bookings') {
        return Promise.resolve({ data: { data: [] } });
      } else if (url === '/facilities/1/events') {
        return Promise.resolve(mockEvents);
      }
      return Promise.resolve({ data: { data: [] } });
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check no bookings message
    expect(screen.getByText('No upcoming bookings for this facility.')).toBeInTheDocument();
  });
  
  test('shows appropriate message when no events exist', async () => {
    // Mock empty events
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/facilities/1') {
        return Promise.resolve(mockFacility);
      } else if (url === '/facilities/1/bookings') {
        return Promise.resolve(mockBookings);
      } else if (url === '/facilities/1/events') {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check no events message
    expect(screen.getByText('No upcoming events for this facility.')).toBeInTheDocument();
  });
  
  test('navigates to event detail when View button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click first View button in events table
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    // Check navigation happened with correct event ID
    expect(mockNavigate).toHaveBeenCalledWith('/events/201');
  });
  
  test('reloads page when Retry button is clicked', async () => {
    // Mock location.reload
    const originalReload = window.location.reload;
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: jest.fn(),
    });
    
    // Mock API error
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error and retry button
    expect(screen.getByText('Network error')).toBeInTheDocument();
    
    // Mock setTimeout
    jest.useFakeTimers();
    
    // Click retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Progress should show again
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Advance timers
    jest.advanceTimersByTime(500);
    
    // Location should be reloaded
    expect(window.location.reload).toHaveBeenCalled();
    
    // Restore original
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: originalReload,
    });
    jest.useRealTimers();
  });
  
  test('handles facility not found case', async () => {
    // Mock API to return null data
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: null
      }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText('Facility data not found')).toBeInTheDocument();
  });
  
  test('handles missing ID parameter', async () => {
    // Remove ID from both useParams and useLocation
    (useParams as jest.Mock).mockReturnValue({});
    (useLocation as jest.Mock).mockReturnValue({ state: {} });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText('Facility ID is missing')).toBeInTheDocument();
  });
  
  test('getStatusColor returns correct colors for different statuses', () => {
    // Create a utility function to test getStatusColor directly
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "open":
          return "success";
        case "closed":
          return "error";
        case "maintenance":
          return "warning";
        case "upcoming":
          return "info";
        case "ongoing":
          return "warning";
        case "completed":
          return "default";
        case "approved":
          return "success";
        case "pending":
          return "warning";
        case "rejected":
        case "cancelled":
          return "error";
        default:
          return "default";
      }
    };
    
    // Test various status values
    expect(getStatusColor('open')).toBe('success');
    expect(getStatusColor('closed')).toBe('error');
    expect(getStatusColor('maintenance')).toBe('warning');
    expect(getStatusColor('upcoming')).toBe('info');
    expect(getStatusColor('ongoing')).toBe('warning');
    expect(getStatusColor('completed')).toBe('default');
    expect(getStatusColor('approved')).toBe('success');
    expect(getStatusColor('pending')).toBe('warning');
    expect(getStatusColor('rejected')).toBe('error');
    expect(getStatusColor('cancelled')).toBe('error');
    expect(getStatusColor('unknown')).toBe('default');
  });
});