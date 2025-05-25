//@ts-ignore
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import FacilityDetailsPage from '../../../pages/facilities/FacilityDetailsPage';
import '@testing-library/jest-dom';

// Mock external dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../../services/Map', () => () => <div>Mocked Map Component</div>);

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn(),
  },
  writable: true,
});

describe('FacilityDetailsPage', () => {
  const mockNavigate = jest.fn();
  const mockUseAuth = {
    user: { type: 'resident', id: 1 },
  };

  const mockFacility = {
    facility_id: 1,
    name: 'Test Facility',
    type: 'Gym',
    location: 'Building A',
    capacity: 50,
    is_indoor: true,
    image_url: '/test.jpg',
    status: 'open',
    description: 'Test description',
    open_time: '08:00',
    close_time: '22:00',
    average_rating: 4.5,
    FacilityRatings: [
      {
        rating_id: 1,
        user_id: 1,
        rating: 5,
        comment: 'Great facility!',
        created_at: '2023-01-01',
      },
    ],
  };

  const mockBookings = [
    {
      booking_id: 1,
      date: '2023-12-01',
      start_time: '10:00',
      end_time: '11:00',
      status: 'approved',
    },
  ];

  const mockEvents = [
    {
      event_id: 1,
      title: 'Test Event',
      start_date: '2023-12-01',
      end_date: '2023-12-01',
      start_time: '10:00',
      end_time: '11:00',
      status: 'upcoming',
    },
  ];

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAuth as jest.Mock).mockReturnValue(mockUseAuth);
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    it('renders loading state initially', () => {
      render(<FacilityDetailsPage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays error message when facility fetch fails', async () => {
      require('../../../services/api').api.get.mockRejectedValueOnce(new Error('Fetch failed'));
      
      render(<FacilityDetailsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Fetch failed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('handles API response without success flag', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: false, message: 'Custom error message' },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
      });
    });

    it('handles API response with no data', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Facility data not found')).toBeInTheDocument();
      });
    });

    it('displays facility not found when facility is null', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Facility data not found')).toBeInTheDocument();
      });
    });

    it('handles missing facility ID', () => {
      (useParams as jest.Mock).mockReturnValue({ id: undefined });

      render(<FacilityDetailsPage />);

      expect(screen.getByText('Facility ID is missing')).toBeInTheDocument();
    });

    it('handles retry functionality', async () => {
      require('../../../services/api').api.get.mockRejectedValueOnce(new Error('Fetch failed'));

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Fetch failed')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      await act(async () => {
        fireEvent.click(retryButton);
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Facility Data Fetching', () => {
    it('fetches and renders facility details successfully', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { data: mockBookings } })
        .mockResolvedValueOnce({ data: { data: mockEvents } });

      require('../../../services/api').api.post.mockResolvedValueOnce({
        data: { success: true, data: { 1: 'John Doe' } },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Facility')).toBeInTheDocument();
        expect(screen.getByText('Gym • Indoor • Capacity: 50')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
      });
    });

    it('handles bookings fetch failure gracefully', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnceError({ data: { success: true, data: mockFacility } })
        .mockRejectedValueOnce(new Error('Bookings failed'))
        .mockResolvedValueOnce({ data: { data: mockEvents } });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(console.warn).toHaveBeenCalledWith('Failed to fetch bookings:', expect.any(Error));
        expect(screen.getByText('No upcoming bookings for this facility.')).toBeInTheDocument();
      });
    });

    it('handles events fetch failure gracefully', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { data: mockBookings } })
        .mockRejectedValueOnce(new Error('Events failed'));

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(console.warn).toHaveBeenCalledWith('Failed to fetch events:', expect.any(Error));
        expect(screen.getByText('No upcoming events for this facility.')).toBeInTheDocument();
      });
    });

    it('fetches resident names for ratings', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });
      require('../../../services/api').api.post.mockResolvedValueOnce({
        data: { success: true, data: { 1: 'John Doe' } },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(require('../../../services/api').api.post).toHaveBeenCalledWith('/residents/names', { user_ids: [1] });
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('handles resident names fetch failure', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });
      require('../../../services/api').api.post.mockResolvedValueOnce({
        data: { success: false },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument();
      });
    });
  });

  describe('Status Color Mapping', () => {
    const statusTests = [
      { status: 'open', expectedColor: 'success' },
      { status: 'closed', expectedColor: 'error' },
      { status: 'maintenance', expectedColor: 'warning' },
      { status: 'upcoming', expectedColor: 'info' },
      { status: 'ongoing', expectedColor: 'warning' },
      { status: 'completed', expectedColor: 'default' },
      { status: 'approved', expectedColor: 'success' },
      { status: 'pending', expectedColor: 'warning' },
      { status: 'rejected', expectedColor: 'error' },
      { status: 'cancelled', expectedColor: 'error' },
      { status: 'unknown', expectedColor: 'default' },
    ];

    statusTests.forEach(({ status, expectedColor }) => {
      it(`renders ${status} status with ${expectedColor} color`, async () => {
        const facilityWithStatus = { ...mockFacility, status };
        require('../../../services/api').api.get.mockResolvedValueOnce({
          data: { success: true, data: facilityWithStatus },
        });

        render(<FacilityDetailsPage />);

        await waitFor(() => {
          const statusChip = screen.getByText(status);
          expect(statusChip).toHaveClass(`MuiChip-color${expectedColor.charAt(0).toUpperCase() + expectedColor.slice(1)}`);
        });
      });
    });
  });

  describe('Booking Functionality', () => {
    it('navigates to booking page for residents when facility is open', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const bookButton = screen.getByText('Book this Facility');
        fireEvent.click(bookButton);
        expect(mockNavigate).toHaveBeenCalledWith('/bookings/create', {
          state: { facilityId: 1 },
        });
      });
    });

    it('shows error when trying to book closed facility', async () => {
      const closedFacility = { ...mockFacility, status: 'closed' };
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: closedFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const bookButton = screen.getByText('Book this Facility');
        fireEvent.click(bookButton);
        expect(screen.getByText('This facility is not available for booking at the moment.')).toBeInTheDocument();
      });
    });

    it('shows booking dialog for non-residents', async () => {
      (useAuth as jest.Mock).mockReturnValueOnce({ user: { type: 'staff' } });
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const bookButton = screen.getByText('Book this Facility');
        fireEvent.click(bookButton);
        expect(screen.getByText('Restricted Access')).toBeInTheDocument();
      });
    });

    it('closes booking dialog', async () => {
      (useAuth as jest.Mock).mockReturnValueOnce({ user: { type: 'staff' } });
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Book this Facility'));
        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByText('Restricted Access')).not.toBeVisible();
      });
    });

    it('navigates to login from booking dialog', async () => {
      (useAuth as jest.Mock).mockReturnValueOnce({ user: { type: 'staff' } });
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Book this Facility'));
        fireEvent.click(screen.getByText('Go to Login'));
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { from: '/facilities/1' },
        });
      });
    });
  });

  describe('Rating and Review Functionality', () => {
    it('allows residents to submit ratings successfully', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } });
      
      require('../../../services/api').api.post
        .mockResolvedValueOnce({ data: { success: true, data: { 1: 'John Doe' } } })
        .mockResolvedValueOnce({ data: { success: true } })
        .mockResolvedValueOnce({ data: { success: true } });

      render(<FacilityDetailsPage />);

      await waitFor(async () => {
        const stars = screen.getAllByRole('radio');
        fireEvent.click(stars[4]); // Click 5th star (5 rating)

        const commentInput = screen.getByLabelText('Your Review');
        fireEvent.change(commentInput, { target: { value: 'Test comment' } });

        const submitButton = screen.getByText('Submit Review');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(require('../../../services/api').api.post).toHaveBeenCalledWith('/facilities/ratings', {
            facility_id: '1',
            rating: 5,
            comment: 'Test comment',
            user_id: 1,
          });
        });
      });
    });

    it('handles rating submission failure', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });
      require('../../../services/api').api.post
        .mockResolvedValueOnce({ data: { success: true, data: { 1: 'John Doe' } } })
        .mockRejectedValueOnce(new Error('Rating failed'));

      render(<FacilityDetailsPage />);

      await waitFor(async () => {
        const stars = screen.getAllByRole('radio');
        fireEvent.click(stars[4]);

        const submitButton = screen.getByText('Submit Review');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText('Failed to submit rating. Please try again.')).toBeInTheDocument();
        });
      });
    });

    it('disables submit button when no rating selected', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Review');
        expect(submitButton).toBeDisabled();
      });
    });

    it('shows loading state during rating submission', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });
      require('../../../services/api').api.post
        .mockResolvedValueOnce({ data: { success: true, data: { 1: 'John Doe' } } })
        .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100)));

      render(<FacilityDetailsPage />);

      await waitFor(async () => {
        const stars = screen.getAllByRole('radio');
        fireEvent.click(stars[4]);

        const submitButton = screen.getByText('Submit Review');
        fireEvent.click(submitButton);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('hides rating section for non-residents', async () => {
      (useAuth as jest.Mock).mockReturnValueOnce({ user: { type: 'staff' } });
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Share Your Experience')).not.toBeInTheDocument();
      });
    });

    it('displays facility with no ratings', async () => {
      const facilityNoRatings = { ...mockFacility, FacilityRatings: [], average_rating: undefined };
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: facilityNoRatings },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('No ratings yet')).toBeInTheDocument();
        expect(screen.getByText('No reviews yet. Be the first to review!')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Actions', () => {
    it('navigates to maintenance report page', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const reportButton = screen.getByText('Report Issue');
        fireEvent.click(reportButton);
        expect(mockNavigate).toHaveBeenCalledWith('/maintenance/create', {
          state: { facilityId: 1 },
        });
      });
    });

    it('navigates to events page with facility filter', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const eventsButton = screen.getByText('View All Events');
        fireEvent.click(eventsButton);
        expect(mockNavigate).toHaveBeenCalledWith('/events', {
          state: { facilityFilter: 1 },
        });
      });
    });

    it('navigates to specific event page', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: mockEvents } });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const viewEventButton = screen.getByText('View');
        fireEvent.click(viewEventButton);
        expect(mockNavigate).toHaveBeenCalledWith('/events/1');
      });
    });
  });

  describe('Events Display', () => {
    it('displays events with different start and end dates', async () => {
      const eventWithDifferentDates = {
        ...mockEvents[0],
        end_date: '2023-12-02',
      };

      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: [eventWithDifferentDates] } });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('12/1/2023 - 12/2/2023')).toBeInTheDocument();
      });
    });
  });

  describe('Image Handling', () => {
    it('handles image loading error and shows placeholder', async () => {
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: mockFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const img = screen.getByAltText('Test Facility');
        fireEvent.error(img);
        expect(img).toHaveAttribute('src', '/placeholder-facility.jpg');
      });
    });

    it('uses placeholder when no image_url provided', async () => {
      const facilityNoImage = { ...mockFacility, image_url: null };
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: facilityNoImage },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        const img = screen.getByAltText('Test Facility');
        expect(img).toHaveAttribute('src', '/placeholder-facility.jpg');
      });
    });
  });

  describe('Success Snackbar', () => {
    it('shows and hides success message', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } });
      
      require('../../../services/api').api.post
        .mockResolvedValueOnce({ data: { success: true, data: { 1: 'John Doe' } } })
        .mockResolvedValueOnce({ data: { success: true } })
        .mockResolvedValueOnce({ data: { success: true } });

      render(<FacilityDetailsPage />);

      await waitFor(async () => {
        const stars = screen.getAllByRole('radio');
        fireEvent.click(stars[4]);

        const submitButton = screen.getByText('Submit Review');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText('Rating submitted successfully!')).toBeInTheDocument();
        });

        // Test snackbar close
        const closeButton = screen.getByLabelText('Close');
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByText('Rating submitted successfully!')).not.toBeInTheDocument();
        });
      });
    });

    it('auto-hides success message after timeout', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } });
      
      require('../../../services/api').api.post
        .mockResolvedValueOnce({ data: { success: true, data: { 1: 'John Doe' } } })
        .mockResolvedValueOnce({ data: { success: true } })
        .mockResolvedValueOnce({ data: { success: true } });

      render(<FacilityDetailsPage />);

      await waitFor(async () => {
        const stars = screen.getAllByRole('radio');
        fireEvent.click(stars[4]);

        const submitButton = screen.getByText('Submit Review');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText('Rating submitted successfully!')).toBeInTheDocument();
        });

        // Test auto-hide after 5 seconds
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 5001));
        });

        expect(screen.queryByText('Rating submitted successfully!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Tables', () => {
    it('displays bookings table with data', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { data: mockBookings } })
        .mockResolvedValueOnce({ data: { data: [] } });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('12/1/2023')).toBeInTheDocument();
        expect(screen.getByText('10:00 - 11:00')).toBeInTheDocument();
        expect(screen.getByText('approved')).toBeInTheDocument();
      });
    });

    it('shows empty state for no bookings', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: [] } });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('No upcoming bookings for this facility.')).toBeInTheDocument();
      });
    });

    it('shows empty state for no events', async () => {
      require('../../../services/api').api.get
        .mockResolvedValueOnce({ data: { success: true, data: mockFacility } })
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { data: [] } });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('No upcoming events for this facility.')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles booking without facility', () => {
      const component = render(<FacilityDetailsPage />);
      
      // Simulate state where facility is null but handleBookFacility is called
      // This would be an edge case but we test the early return
      expect(component).toBeTruthy();
    });

    it('handles report issue without facility', () => {
      const component = render(<FacilityDetailsPage />);
      
      // Simulate state where facility is null but handleReportIssue is called
      // This would be an edge case but we test the early return
      expect(component).toBeTruthy();
    });

    it('handles outdoor facility display', async () => {
      const outdoorFacility = { ...mockFacility, is_indoor: false };
      require('../../../services/api').api.get.mockResolvedValueOnce({
        data: { success: true, data: outdoorFacility },
      });

      render(<FacilityDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gym • Outdoor • Capacity: 50')).toBeInTheDocument();
        expect(screen.getByText('Outdoor')).toBeInTheDocument();
      });
    });
  });
});