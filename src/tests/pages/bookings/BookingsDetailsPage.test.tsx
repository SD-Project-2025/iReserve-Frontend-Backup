
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

describe('BookingDetailsPage', () => {
  const mockNavigate = jest.fn();
  const mockApiGet = api.get as jest.Mock;
  const mockApiPut = api.put as jest.Mock;

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockApiGet.mockResolvedValue({ data: { data: mockBooking } });
    mockApiPut.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders booking details correctly', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Practice')).toBeInTheDocument();
      expect(screen.getByText('Tennis Court • Sports Complex')).toBeInTheDocument();
      expect(screen.getByText('4 attendees')).toBeInTheDocument();
    });
  });

  it('shows correct status chip', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      const chip = screen.getByText('approved');
      expect(chip).toHaveClass('MuiChip-colorSuccess');
    });
  });

  it('opens cancel confirmation dialog', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Cancel Booking'));
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  it('navigates to facility page', async () => {
    render(<BookingDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('View Facility'));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/facilities/1',
        expect.objectContaining({ state: { id: 1 } })
      );
    });
  });
});