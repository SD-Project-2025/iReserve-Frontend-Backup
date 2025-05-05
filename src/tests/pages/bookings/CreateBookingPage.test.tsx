import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateBookingPage from '@/pages/bookings/CreateBookingPage';
import { api } from '@/services/api';

// Mock useLocation and useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: null }),
  useNavigate: () => jest.fn()
}));

// Mock the entire api module
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockFacilities = {
  data: [
    { facility_id: 1, name: 'Main Auditorium', type: 'Auditorium', status: 'open' },
    { facility_id: 2, name: 'Conference Room', type: 'Meeting', status: 'open' },
  ],
};

describe('CreateBookingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockFacilities });
  });

  test('renders loading state initially', async () => {
    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  test('displays facilities after loading', async () => {
    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Main Auditorium (Auditorium)')).toBeInTheDocument();
      expect(screen.getByText('Conference Room (Meeting)')).toBeInTheDocument();
    });
  });

  test('handles API error when fetching facilities', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('API failed'));
    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Failed to load facilities. Please try again later.')).toBeInTheDocument();
    });
  });

  test('validates step 1 (facility and time selection)', async () => {
    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Please select a facility')).toBeInTheDocument();
      expect(screen.getByText('Please select a date')).toBeInTheDocument();
      expect(screen.getByText('Please select a start time')).toBeInTheDocument();
      expect(screen.getByText('Please select an end time')).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByLabelText('Date'));
    fireEvent.click(screen.getByText('15'));
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '12:00' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    });
  });

  test('validates step 2 (booking details)', async () => {
    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    fireEvent.mouseDown(screen.getByLabelText('Facility'));
    fireEvent.click(screen.getByText('Main Auditorium (Auditorium)'));
    fireEvent.mouseDown(screen.getByLabelText('Date'));
    fireEvent.click(screen.getByText('15'));
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '16:00' } });
    fireEvent.click(screen.getByText('Next'));

    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Please enter a purpose')).toBeInTheDocument();
      expect(screen.getByText('Please enter the number of attendees')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Number of Attendees'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid number of attendees')).toBeInTheDocument();
    });
  });

  test('navigates through all steps successfully', async () => {
    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    fireEvent.mouseDown(screen.getByLabelText('Facility'));
    fireEvent.click(screen.getByText('Main Auditorium (Auditorium)'));
    fireEvent.mouseDown(screen.getByLabelText('Date'));
    fireEvent.click(screen.getByText('15'));
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '16:00' } });
    fireEvent.click(screen.getByText('Next'));

    fireEvent.change(screen.getByLabelText('Purpose'), { target: { value: 'Team Meeting' } });
    fireEvent.change(screen.getByLabelText('Number of Attendees'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Booking Summary')).toBeInTheDocument();
      expect(screen.getByText('Main Auditorium')).toBeInTheDocument();
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  test('submits booking successfully', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ status: 201 });

    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    fireEvent.mouseDown(screen.getByLabelText('Facility'));
    fireEvent.click(screen.getByText('Main Auditorium (Auditorium)'));
    fireEvent.mouseDown(screen.getByLabelText('Date'));
    fireEvent.click(screen.getByText('15'));
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '16:00' } });
    fireEvent.click(screen.getByText('Next'));

    fireEvent.change(screen.getByLabelText('Purpose'), { target: { value: 'Team Meeting' } });
    fireEvent.change(screen.getByLabelText('Number of Attendees'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));

    fireEvent.click(screen.getByText('Submit Booking'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/bookings', {
        facility_id: 1,
        date: expect.any(String),
        start_time: '14:00',
        end_time: '16:00',
        purpose: 'Team Meeting',
        attendees: 10,
        notes: '',
      });
    });
  });

  test('handles booking submission error', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Facility not available at selected time' } },
    });

    render(<MemoryRouter><CreateBookingPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Main Auditorium (Auditorium)'));

    fireEvent.mouseDown(screen.getByLabelText('Facility'));
    fireEvent.click(screen.getByText('Main Auditorium (Auditorium)'));
    fireEvent.mouseDown(screen.getByLabelText('Date'));
    fireEvent.click(screen.getByText('15'));
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '16:00' } });
    fireEvent.click(screen.getByText('Next'));

    fireEvent.change(screen.getByLabelText('Purpose'), { target: { value: 'Team Meeting' } });
    fireEvent.change(screen.getByLabelText('Number of Attendees'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));

    fireEvent.click(screen.getByText('Submit Booking'));

    await waitFor(() => {
      expect(screen.getByText('Facility not available at selected time')).toBeInTheDocument();
    });
  });
});
