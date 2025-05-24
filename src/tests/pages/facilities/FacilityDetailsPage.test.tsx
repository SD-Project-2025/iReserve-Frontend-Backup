//@ts-ignore
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAuth as jest.Mock).mockReturnValue(mockUseAuth);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<FacilityDetailsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when facility fetch fails', async () => {
    (require('../../../services/api').api.get.mockRejectedValueOnce(new Error('Fetch failed')));
    
    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Fetch failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('renders facility details when loaded', async () => {
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacility },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Facility')).toBeInTheDocument();
      expect(screen.getByText('Gym • Indoor • Capacity: 50')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Building A')).toBeInTheDocument();
      expect(screen.getByText('08:00 - 22:00')).toBeInTheDocument();
    });
  });

  it('shows facility status chip with correct color', async () => {
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacility },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      const statusChip = screen.getByText('open');
      expect(statusChip).toHaveClass('MuiChip-colorSuccess');
    });
  });

  it('displays rating section correctly', async () => {
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacility },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('4.5/5 (1 review)')).toBeInTheDocument();
      expect(screen.getByText('Great facility!')).toBeInTheDocument();
      expect(screen.getByText('Share Your Experience')).toBeInTheDocument();
    });
  });

  it('allows residents to submit ratings', async () => {
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacility },
    }));
    (require('../../../services/api').api.post.mockResolvedValueOnce({
      data: { success: true },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(async () => {
      const stars = screen.getAllByRole('radio');
      fireEvent.click(stars[4]); // Click 5th star (5 rating)
      
      const commentInput = screen.getByLabelText('Your Review');
      fireEvent.change(commentInput, { target: { value: 'Test comment' } });
      
      fireEvent.click(screen.getByText('Submit Review'));
      
      await waitFor(() => {
        expect(require('../../../services/api').api.post).toHaveBeenCalledWith(
          '/facilities/ratings',
          expect.objectContaining({
            rating: 5,
            comment: 'Test comment',
          })
        );
      });
    });
  });

  it('shows booking dialog for non-residents', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({ user: { type: 'staff' } });
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacility },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Book this Facility'));
      expect(screen.getByText('Restricted Access')).toBeInTheDocument();
    });
  });

  it('navigates to booking page for residents', async () => {
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacility },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Book this Facility'));
      expect(mockNavigate).toHaveBeenCalledWith('/bookings/create', {
        state: { facilityId: 1 },
      });
    });
  });

  it('handles image loading error', async () => {
    const mockFacilityWithBadImage = {
      ...mockFacility,
      image_url: 'invalid.jpg',
    };
    
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacilityWithBadImage },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      const img = screen.getByAltText('Test Facility');
      fireEvent.error(img);
      expect(img).toHaveAttribute('src', '/placeholder-facility.jpg');
    });
  });

  it('displays empty states for no bookings/events', async () => {
    const mockFacilityWithoutEvents = {
      ...mockFacility,
      FacilityRatings: [],
    };
    
    (require('../../../services/api').api.get.mockResolvedValueOnce({
      data: { success: true, data: mockFacilityWithoutEvents },
    }));

    render(<FacilityDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No upcoming bookings for this facility.')).toBeInTheDocument();
      expect(screen.getByText('No upcoming events for this facility.')).toBeInTheDocument();
      expect(screen.getByText('No reviews yet. Be the first to review!')).toBeInTheDocument();
    });
  });
});