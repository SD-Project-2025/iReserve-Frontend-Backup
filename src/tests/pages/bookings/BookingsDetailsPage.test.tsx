import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingDetailsPage from '@/pages/bookings/BookingDetailsPage';
import { api } from '@/services/api';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('@/services/api');

const mockBooking = {
  booking_id: 1,
  Facility: {
    facility_id: 1,
    name: 'Tennis Court',
    location: 'Sports Complex'
  },
  date: '2023-06-20',
  start_time: '10:00',
  end_time: '12:00',
  status: 'approved',
  purpose: 'Weekly Practice',
  attendees: 4,
  notes: 'Bring own rackets',
  created_at: '2023-06-15T09:00:00Z'
};

const mockPendingBooking = {
  ...mockBooking,
  status: 'pending'
};

const mockCancelledBooking = {
  ...mockBooking,
  status: 'cancelled'
};

const mockRejectedBooking = {
  ...mockBooking,
  status: 'rejected'
};

const mockBookingWithoutNotes = {
  ...mockBooking,
  notes: ''
};

describe('BookingDetailsPage', () => {
  const mockNavigate = jest.fn();
  const mockApiGet = api.get as jest.Mock;
  const mockApiPut = api.put as jest.Mock;
  const mockApiPost = api.post as jest.Mock;

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockApiGet.mockResolvedValue({ data: { data: mockBooking } });
    mockApiPut.mockResolvedValue({});
    mockApiPost.mockResolvedValue({});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Loading state test
  it('shows loading state initially', () => {
    render(<BookingDetailsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // Error handling tests
  it('handles API error when fetching booking details', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = {
      response: {
        status: 404,
        data: { message: 'Booking not found' }
      }
    };
    mockApiGet.mockRejectedValue(mockError);
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error 404: Booking not found')).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('handles network error when fetching booking details', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApiGet.mockRejectedValue(new Error('Network Error'));
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load booking details. Please check your connection and try again.')).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('handles missing booking ID parameter', async () => {
    (useParams as jest.Mock).mockReturnValue({});
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No booking ID provided.')).toBeInTheDocument();
    });
    
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it('shows "Booking not found" when booking is null', async () => {
    mockApiGet.mockResolvedValue({ data: { data: null } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Booking not found.')).toBeInTheDocument();
    });
  });

  // Booking details rendering tests
  it('renders booking details correctly', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Booking Details')).toBeInTheDocument();
      expect(screen.getByText('Weekly Practice')).toBeInTheDocument();
      expect(screen.getByText('Tennis Court • Sports Complex')).toBeInTheDocument();
      expect(screen.getByText('4 attendees')).toBeInTheDocument();
      expect(screen.getByText('Additional Notes')).toBeInTheDocument();
      expect(screen.getByText('Bring own rackets')).toBeInTheDocument();
    });
  });

  it('renders booking without notes correctly', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockBookingWithoutNotes } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Practice')).toBeInTheDocument();
      expect(screen.queryByText('Additional Notes')).not.toBeInTheDocument();
    });
  });

  it('handles facility with missing name gracefully', async () => {
    const bookingMissingFacilityName = {
      ...mockBooking,
      Facility: { ...mockBooking.Facility, name: '' }
    };
    mockApiGet.mockResolvedValue({ data: { data: bookingMissingFacilityName } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('• Sports Complex')).toBeInTheDocument();
    });
  });

  it('handles facility with missing location gracefully', async () => {
    const bookingMissingLocation = {
      ...mockBooking,
      Facility: { ...mockBooking.Facility, location: '' }
    };
    mockApiGet.mockResolvedValue({ data: { data: bookingMissingLocation } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Tennis Court • ')).toBeInTheDocument();
    });
  });

  it('handles null facility gracefully', async () => {
    const bookingNullFacility = {
      ...mockBooking,
      Facility: null
    };
    mockApiGet.mockResolvedValue({ data: { data: bookingNullFacility } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Practice')).toBeInTheDocument();
      // Should not crash when Facility is null
    });
  });

  // Status chip tests
  it('shows approved status chip with success color', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      const chip = screen.getByText('approved');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-colorSuccess')).toBeInTheDocument();
    });
  });

  it('shows pending status chip with warning color', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockPendingBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      const chip = screen.getByText('pending');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-colorWarning')).toBeInTheDocument();
    });
  });

  it('shows cancelled status chip with error color', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockCancelledBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      const chip = screen.getByText('cancelled');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-colorError')).toBeInTheDocument();
    });
  });

  it('shows rejected status chip with error color', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockRejectedBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      const chip = screen.getByText('rejected');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-colorError')).toBeInTheDocument();
    });
  });

  it('shows default status chip for unknown status', async () => {
    const unknownStatusBooking = { ...mockBooking, status: 'unknown' };
    mockApiGet.mockResolvedValue({ data: { data: unknownStatusBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      const chip = screen.getByText('unknown');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-colorDefault')).toBeInTheDocument();
    });
  });

  // Navigation tests
  it('navigates to facility page with correct state', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('View Facility'));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/facilities/1',
        { state: { id: 1 } }
      );
    });
  });

  it('navigates back to bookings list', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Back to Bookings'));
      expect(mockNavigate).toHaveBeenCalledWith('/bookings');
    });
  });

  it('handles navigation with null facility gracefully', async () => {
    const bookingNullFacility = {
      ...mockBooking,
      Facility: null
    };
    mockApiGet.mockResolvedValue({ data: { data: bookingNullFacility } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('View Facility'));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/facilities/undefined',
        { state: { id: undefined } }
      );
    });
  });

  // Cancel booking functionality tests
  it('shows cancel button for approved booking', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    });
  });

  it('shows cancel button for pending booking', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockPendingBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
    });
  });

  it('does not show cancel button for cancelled booking', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockCancelledBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Cancel Booking')).not.toBeInTheDocument();
    });
  });

  it('does not show cancel button for rejected booking', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockRejectedBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Cancel Booking')).not.toBeInTheDocument();
    });
  });

  it('opens cancel confirmation dialog', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
      expect(screen.getByText('Cancel Booking', { selector: 'h2' })).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to cancel this booking? This action cannot be undone.')).toBeInTheDocument();
    });
  });

  it('closes cancel dialog when clicking "No, Keep Booking"', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
    });
    
    fireEvent.click(screen.getByText('No, Keep Booking'));
    
    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to cancel this booking?')).not.toBeInTheDocument();
    });
  });

  it('closes cancel dialog when clicking outside', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
    });
    
    // Click on backdrop
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to cancel this booking?')).not.toBeInTheDocument();
    });
  });

  it('successfully cancels booking and sends notification', async () => {
    const updatedBooking = { ...mockBooking, status: 'cancelled' };
    mockApiPut.mockResolvedValue({});
    mockApiGet.mockResolvedValueOnce({ data: { data: mockBooking } });
    mockApiGet.mockResolvedValueOnce({ data: { data: updatedBooking } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
    });
    
    fireEvent.click(screen.getByText('Yes, Cancel Booking'));
    
    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/bookings/1/cancel');
      expect(mockApiGet).toHaveBeenCalledWith('/bookings/1');
      expect(mockApiPost).toHaveBeenCalledWith('/notifications', {
        title: 'Booking Cancelled',
        message: 'You have successfully cancelled your booking for the event Weekly Practice.',
        type: 'booking',
        related_id: '1',
        related_type: 'booking',
      });
    });
  });

  it('shows loading spinner while cancelling', async () => {
    // Mock a delayed response
    mockApiPut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
    });
    
    fireEvent.click(screen.getByText('Yes, Cancel Booking'));
    
    // Should show loading spinner in button
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('disables buttons while cancelling', async () => {
    mockApiPut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
    });
    
    fireEvent.click(screen.getByText('Yes, Cancel Booking'));
    
    await waitFor(() => {
      expect(screen.getByText('No, Keep Booking')).toBeDisabled();
      expect(screen.getByText('Yes, Cancel Booking')).toBeDisabled();
    });
  });

  it('handles cancel booking API error with response', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = {
      response: {
        status: 400,
        data: { message: 'Cannot cancel booking' }
      }
    };
    mockApiPut.mockRejectedValue(mockError);
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
    });
    
    fireEvent.click(screen.getByText('Yes, Cancel Booking'));
    
    await waitFor(() => {
      expect(screen.getByText('Error 400: Cannot cancel booking')).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('handles cancel booking network error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApiPut.mockRejectedValue(new Error('Network Error'));
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
    });
    
    fireEvent.click(screen.getByText('Yes, Cancel Booking'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to cancel booking. Please try again later.')).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  // Date and time formatting tests
  it('formats date correctly', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('6/20/2023')).toBeInTheDocument();
    });
  });

  it('formats created_at timestamp correctly', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      // Check if timestamp is displayed (format may vary by locale)
      expect(screen.getByText(/Booking created on/)).toBeInTheDocument();
    });
  });

  // Console log coverage
  it('logs booking ID and data on fetch', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith('Booking ID from route:', '1');
      expect(consoleLogSpy).toHaveBeenCalledWith('Booking Data,', { data: mockBooking });
      expect(consoleLogSpy).toHaveBeenCalledWith('Fetched booking data:', { data: mockBooking });
    });
    
    consoleLogSpy.mockRestore();
  });

  // Edge case: Zero attendees
  it('handles zero attendees correctly', async () => {
    const bookingZeroAttendees = { ...mockBooking, attendees: 0 };
    mockApiGet.mockResolvedValue({ data: { data: bookingZeroAttendees } });
    
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('0 attendees')).toBeInTheDocument();
    });
  });
});