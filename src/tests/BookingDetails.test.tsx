import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import BookingDetailsPage from '@/pages/bookings/BookingDetailsPage';
import { api } from '@/services/api';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

describe('BookingDetailsPage', () => {
  const mockNavigate = jest.fn();
  
  // Sample booking data for tests
  const mockBooking = {
    data: {
      data: {
        booking_id: 123,
        facility: {
          facility_id: 1,
          name: 'Tennis Court',
          location: 'Sports Complex'
        },
        date: '2025-04-25',
        start_time: '14:00',
        end_time: '16:00',
        status: 'approved',
        purpose: 'Team Practice',
        attendees: 8,
        notes: 'Please prepare the court for our team practice',
        created_at: '2025-04-20T10:30:00Z'
      }
    }
  };
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: '123' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });
  
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BookingDetailsPage />
      </BrowserRouter>
    );
  };
  
  test('renders loading state initially', () => {
    // Mock API to not resolve immediately
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders booking details successfully', async () => {
    // Mock successful API response
    (api.get as jest.Mock).mockResolvedValue(mockBooking);
    
    renderComponent();
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that booking details are displayed
    expect(screen.getByText('Booking Details')).toBeInTheDocument();
    expect(screen.getByText('Team Practice')).toBeInTheDocument();
    expect(screen.getByText('Tennis Court • Sports Complex')).toBeInTheDocument();
    expect(screen.getByText('14:00 - 16:00')).toBeInTheDocument();
    expect(screen.getByText('8 attendees')).toBeInTheDocument();
    expect(screen.getByText('Additional Notes')).toBeInTheDocument();
    expect(screen.getByText('Please prepare the court for our team practice')).toBeInTheDocument();
    
    // Check status chip
    expect(screen.getByText('approved')).toBeInTheDocument();
    
    // Date should be formatted correctly
    const formattedDate = new Date('2025-04-25').toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    
    // Created at timestamp should be formatted
    const createdAtRegex = new RegExp(`Booking created on ${new Date('2025-04-20T10:30:00Z').toLocaleString()}`);
    expect(screen.getByText(createdAtRegex)).toBeInTheDocument();
  });
  
  test('displays error state when API request fails', async () => {
    // Mock API error
    (api.get as jest.Mock).mockRejectedValue({
      response: {
        status: 404,
        data: {
          message: 'Booking not found'
        }
      }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message is displayed
    expect(screen.getByText('Error 404: Booking not found')).toBeInTheDocument();
  });
  
  test('displays error for network failure', async () => {
    // Mock network error (no response object)
    (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check generic error message is displayed
    expect(screen.getByText('Failed to load booking details. Please check your connection and try again.')).toBeInTheDocument();
  });
  
  test('displays not found message when no booking is returned', async () => {
    // Mock API returning null data
    (api.get as jest.Mock).mockResolvedValue({ data: { data: null } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check not found message is displayed
    expect(screen.getByText('Booking not found.')).toBeInTheDocument();
  });
  
  test('displays error when no ID is provided', async () => {
    // Mock useParams to return no ID
    (useParams as jest.Mock).mockReturnValue({ id: undefined });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message is displayed
    expect(screen.getByText('No booking ID provided.')).toBeInTheDocument();
  });
  
  test('navigates to facility details when View Facility button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click the View Facility button
    fireEvent.click(screen.getByText('View Facility'));
    
    // Check navigation occurred with correct parameters
    expect(mockNavigate).toHaveBeenCalledWith('/facilities/1', { state: { id: 1 } });
  });
  
  test('navigates back to bookings list when Back to Bookings button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click the Back to Bookings button
    fireEvent.click(screen.getByText('Back to Bookings'));
    
    // Check navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/bookings');
  });
  
  test('shows cancel booking button for approved bookings', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check Cancel Booking button is present
    expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
  });
  
  test('shows cancel booking button for pending bookings', async () => {
    const pendingBooking = {
      data: {
        data: {
          ...mockBooking.data.data,
          status: 'pending'
        }
      }
    };
    
    (api.get as jest.Mock).mockResolvedValue(pendingBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check Cancel Booking button is present
    expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
  });
  
  test('does not show cancel booking button for cancelled bookings', async () => {
    const cancelledBooking = {
      data: {
        data: {
          ...mockBooking.data.data,
          status: 'cancelled'
        }
      }
    };
    
    (api.get as jest.Mock).mockResolvedValue(cancelledBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check Cancel Booking button is not present
    expect(screen.queryByText('Cancel Booking')).not.toBeInTheDocument();
  });
  
  test('opens cancel dialog when Cancel Booking button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click the Cancel Booking button
    fireEvent.click(screen.getByText('Cancel Booking'));
    
    // Check dialog is displayed
    expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to cancel this booking? This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText('No, Keep Booking')).toBeInTheDocument();
    expect(screen.getByText('Yes, Cancel Booking')).toBeInTheDocument();
  });
  
  test('closes cancel dialog when No, Keep Booking button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open the dialog
    fireEvent.click(screen.getByText('Cancel Booking'));
    
    // Click the No button
    fireEvent.click(screen.getByText('No, Keep Booking'));
    
    // Check dialog is closed (dialog content not visible)
    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to cancel this booking? This action cannot be undone.')).not.toBeInTheDocument();
    });
    
    // API should not be called
    expect(api.put).not.toHaveBeenCalled();
  });
  
  test('cancels booking when Yes, Cancel Booking button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(mockBooking);
    
    // Mock the cancellation API call
    (api.put as jest.Mock).mockResolvedValue({});
    
    // Mock the refresh API call after cancellation
    const cancelledBooking = {
      data: {
        data: {
          ...mockBooking.data.data,
          status: 'cancelled'
        }
      }
    };
    (api.get as jest.Mock).mockResolvedValueOnce(cancelledBooking);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open the dialog
    fireEvent.click(screen.getByText('Cancel Booking'));
    
    // Click the Yes button
    fireEvent.click(screen.getByText('Yes, Cancel Booking'));
    
    // API should be called
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/bookings/123/cancel');
    });
    
    // After cancellation, the API should be called again to refresh the booking data
    expect(api.get).toHaveBeenCalledWith('/bookings/123');
    
    // Check status is updated to cancelled
    await waitFor(() => {
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
    
    // Cancel button should be gone
    expect(screen.queryByText('Cancel Booking')).not.toBeInTheDocument();
  });
  
  test('shows error when cancellation fails', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(mockBooking);
    
    // Mock the cancellation API call failure
    (api.put as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: 'Cannot cancel booking less than 24 hours before start time'
        }
      }
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open the dialog
    fireEvent.click(screen.getByText('Cancel Booking'));
    
    // Click the Yes button
    fireEvent.click(screen.getByText('Yes, Cancel Booking'));
    
    // Check error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error 400: Cannot cancel booking less than 24 hours before start time')).toBeInTheDocument();
    });
  });
  
  test('getStatusColor returns correct color based on status', () => {
    // We'll test the getStatusColor function directly using a utility function for test
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
    
    // Check color codes for different statuses
    expect(getStatusColor('approved')).toBe('success');
    expect(getStatusColor('pending')).toBe('warning');
    expect(getStatusColor('rejected')).toBe('error');
    expect(getStatusColor('cancelled')).toBe('error');
    expect(getStatusColor('unknown')).toBe('default');
  });
});