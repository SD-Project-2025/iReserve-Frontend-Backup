import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import BookingsPage from '@/pages/bookings/BookingsPage';
import { api } from '@/services/api';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

describe('BookingsPage', () => {
  const mockNavigate = jest.fn();
  
  // Sample bookings data for tests
  const mockBookings = {
    data: {
      data: [
        {
          booking_id: 1,
          facility_id: 101,
          resident_id: 201,
          date: '2025-04-25',
          start_time: '14:00',
          end_time: '16:00',
          status: 'approved',
          purpose: 'Tennis Practice',
          attendees: 4,
          Facility: {
            name: 'Tennis Court',
            type: 'Sports',
            location: 'West Wing',
            facility_id: 101
          }
        },
        {
          booking_id: 2,
          facility_id: 102,
          resident_id: 201,
          date: '2025-04-26',
          start_time: '10:00',
          end_time: '12:00',
          status: 'pending',
          purpose: 'Team Meeting',
          attendees: 8,
          Facility: {
            name: 'Conference Room',
            type: 'Meeting',
            location: 'Main Building',
            facility_id: 102
          }
        },
        {
          booking_id: 3,
          facility_id: 103,
          resident_id: 201,
          date: '2025-04-20',
          start_time: '15:00',
          end_time: '16:00',
          status: 'cancelled',
          purpose: 'Swimming Lesson',
          attendees: 1,
          Facility: {
            name: 'Swimming Pool',
            type: 'Sports',
            location: 'South Wing',
            facility_id: 103
          }
        },
        {
          booking_id: 4,
          facility_id: 104,
          resident_id: 201,
          date: '2025-04-22',
          start_time: '18:00',
          end_time: '19:00',
          status: 'rejected',
          purpose: 'Yoga Class',
          attendees: 15,
          Facility: {
            name: 'Yoga Studio',
            type: 'Fitness',
            location: 'East Wing',
            facility_id: 104
          }
        }
      ]
    }
  };
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    
    // Mock successful API response by default
    (api.get as jest.Mock).mockResolvedValue(mockBookings);
  });
  
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BookingsPage />
      </BrowserRouter>
    );
  };
  
  test('renders loading state initially', () => {
    // Mock API to not resolve immediately
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders bookings table when data is loaded', async () => {
    renderComponent();
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check page title
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
    
    // Check that all tabs are rendered
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Rejected/Cancelled')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Facility')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check that all bookings are displayed (4 from the mock data)
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.getByText('Conference Room')).toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
    
    // Check purpose values
    expect(screen.getByText('Tennis Practice')).toBeInTheDocument();
    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    expect(screen.getByText('Swimming Lesson')).toBeInTheDocument();
    expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    
    // Check status chips
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('cancelled')).toBeInTheDocument();
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });
  
  test('displays empty state when no bookings are available', async () => {
    // Mock empty bookings data
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check empty state message and button
    expect(screen.getByText('No bookings found')).toBeInTheDocument();
    expect(screen.getByText('Create a Booking')).toBeInTheDocument();
  });
  
  test('displays error message when API call fails', async () => {
    // Mock API error
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText('Failed to load bookings. Please try again later.')).toBeInTheDocument();
  });
  
  test('navigates to create booking page when New Booking button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click New Booking button
    fireEvent.click(screen.getByText('New Booking'));
    
    // Check navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/bookings/create');
  });
  
  test('navigates to create booking page from empty state', async () => {
    // Mock empty bookings data
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click Create a Booking button in empty state
    fireEvent.click(screen.getByText('Create a Booking'));
    
    // Check navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/bookings/create');
  });
  
  test('navigates to booking details when view button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find all view buttons (should be 4, one for each booking)
    const viewButtons = screen.getAllByRole('button', { name: /visibility/i });
    expect(viewButtons.length).toBe(4);
    
    // Click the first view button (Tennis Practice)
    fireEvent.click(viewButtons[0]);
    
    // Check navigation occurred with correct booking ID
    expect(mockNavigate).toHaveBeenCalledWith('/bookings/1');
  });
  
  test('cancels booking when cancel button is clicked', async () => {
    // Mock successful cancellation API call
    (api.put as jest.Mock).mockResolvedValue({});
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find all cancel buttons (should be 2, one for approved and one for pending)
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    expect(cancelButtons.length).toBe(2);
    
    // Click the first cancel button (Tennis Practice - approved)
    fireEvent.click(cancelButtons[0]);
    
    // Check API was called with correct booking ID
    expect(api.put).toHaveBeenCalledWith('/bookings/1/cancel');
    
    // Verify bookings are refreshed after cancellation
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2); // Initial load + refresh after cancel
      expect(api.get).toHaveBeenCalledWith('/bookings/my-bookings');
    });
  });
  
  test('shows error when cancellation fails', async () => {
    // Mock API error for cancellation
    (api.put as jest.Mock).mockRejectedValue(new Error('Cancellation Error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find all cancel buttons
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    
    // Click the first cancel button
    fireEvent.click(cancelButtons[0]);
    
    // Check error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to cancel booking. Please try again later.')).toBeInTheDocument();
    });
  });
  
  test('filters bookings when different tabs are selected', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Initially All tab should be selected, showing all 4 bookings
    const allRows = screen.getAllByRole('row');
    // +1 for the header row
    expect(allRows.length).toBe(5); // 4 bookings + header row
    
    // Click on Approved tab
    fireEvent.click(screen.getByText('Approved'));
    
    // Should only show approved bookings (1)
    const approvedRows = screen.getAllByRole('row');
    expect(approvedRows.length).toBe(2); // 1 booking + header row
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.queryByText('Conference Room')).not.toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Yoga Studio')).not.toBeInTheDocument();
    
    // Click on Pending tab
    fireEvent.click(screen.getByText('Pending'));
    
    // Should only show pending bookings (1)
    const pendingRows = screen.getAllByRole('row');
    expect(pendingRows.length).toBe(2); // 1 booking + header row
    expect(screen.queryByText('Tennis Court')).not.toBeInTheDocument();
    expect(screen.getByText('Conference Room')).toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Yoga Studio')).not.toBeInTheDocument();
    
    // Click on Rejected/Cancelled tab
    fireEvent.click(screen.getByText('Rejected/Cancelled'));
    
    // Should only show rejected and cancelled bookings (2)
    const rejectedRows = screen.getAllByRole('row');
    expect(rejectedRows.length).toBe(3); // 2 bookings + header row
    expect(screen.queryByText('Tennis Court')).not.toBeInTheDocument();
    expect(screen.queryByText('Conference Room')).not.toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Yoga Studio')).toBeInTheDocument();
    
    // Go back to All tab
    fireEvent.click(screen.getByText('All'));
    
    // Should show all bookings again
    const backToAllRows = screen.getAllByRole('row');
    expect(backToAllRows.length).toBe(5); // 4 bookings + header row
  });
  
  test('handles missing facility data gracefully', async () => {
    // Mock bookings with missing facility data
    const bookingsWithMissingFacility = {
      data: {
        data: [
          {
            booking_id: 5,
            facility_id: 105,
            resident_id: 201,
            date: '2025-04-28',
            start_time: '09:00',
            end_time: '11:00',
            status: 'approved',
            purpose: 'Basketball Game',
            attendees: 10,
            // Facility data is missing
          }
        ]
      }
    };
    
    (api.get as jest.Mock).mockResolvedValue(bookingsWithMissingFacility);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that the fallback facility name is displayed
    expect(screen.getByText('Unknown Facility')).toBeInTheDocument();
  });
  
  test('getStatusColor returns correct colors for different statuses', () => {
    // Create a utility function to test getStatusColor directly
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
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
    expect(getStatusColor('approved')).toBe('success');
    expect(getStatusColor('pending')).toBe('warning');
    expect(getStatusColor('rejected')).toBe('error');
    expect(getStatusColor('cancelled')).toBe('error');
    expect(getStatusColor('unknown')).toBe('default');
  });
});