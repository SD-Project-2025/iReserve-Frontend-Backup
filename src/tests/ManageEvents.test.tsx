import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ManageEventsPage from '@/pages/admin/ManageEventsPage';
import { api } from '@/services/api';

// Mock API
jest.mock('@/services/api');

// Mock MUI icons individually
jest.mock('@mui/icons-material/Add', () => () => <div>AddIcon</div>);
jest.mock('@mui/icons-material/Edit', () => () => <div>EditIcon</div>);
jest.mock('@mui/icons-material/Delete', () => () => <div>DeleteIcon</div>);
jest.mock('@mui/icons-material/Visibility', () => () => <div>ViewIcon</div>);
jest.mock('@mui/icons-material/Refresh', () => () => <div>RefreshIcon</div>);
jest.mock('@mui/icons-material/Search', () => () => <div>SearchIcon</div>);

const mockEvents = [
  {
    event_id: 1,
    title: 'Tech Conference',
    description: 'Annual technology conference',
    facility_id: 1,
    Facility: {
      name: 'Conference Hall',
      type: 'Conference Room',
      location: 'Floor 10',
      facility_id: 1
    },
    start_date: '2023-08-01',
    end_date: '2023-08-03',
    start_time: '09:00',
    end_time: '18:00',
    status: 'upcoming',
    capacity: 500,
    current_attendees: 250,
    image_url: '',
    is_public: true,
    registration_deadline: '2023-07-30',
    fee: '100.00',
    organizer: {
      staff_id: 1,
      employee_id: 'EMP-001',
      position: 'Event Manager'
    }
  },
  {
    event_id: 2,
    title: 'Workshop',
    description: 'React Training',
    facility_id: 2,
    Facility: {
      name: 'Training Room',
      type: 'Workshop Space',
      location: 'Floor 5',
      facility_id: 2
    },
    start_date: '2023-08-05',
    end_date: '2023-08-05',
    start_time: '10:00',
    end_time: '16:00',
    status: 'completed',
    capacity: 50,
    current_attendees: 50,
    image_url: '',
    is_public: false,
    registration_deadline: '2023-08-01',
    fee: '50.00',
    organizer: {
      staff_id: 2,
      employee_id: 'EMP-002',
      position: 'Training Coordinator'
    }
  }
];

describe('ManageEventsPage', () => {
  const mockApiGet = api.get as jest.Mock;
  const mockApiDelete = api.delete as jest.Mock;

  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiDelete.mockReset();
    localStorage.clear();
  });

  test('renders loading state initially', async () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays events after successful fetch', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockEvents } });
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Tech Conference')).toBeInTheDocument();
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });
  });

  test('shows no facilities message for staff', async () => {
    // Mock staff user with no facilities
    localStorage.setItem('user', JSON.stringify({
      profile: { staff_id: 123, is_admin: false }
    }));
    
    mockApiGet
      .mockRejectedValueOnce({ response: { data: { message: 'No facilities assigned' } } });
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/no facilities assigned/i)).toBeInTheDocument();
    });
  });

  test('filters events by search term', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockEvents } });
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    await waitFor(() => {
      const searchInput = screen.getByLabelText('Search events');
      fireEvent.change(searchInput, { target: { value: 'Workshop' } });
      
      expect(screen.getByText('Workshop')).toBeInTheDocument();
      expect(screen.queryByText('Tech Conference')).not.toBeInTheDocument();
    });
  });

  test('deletes an event successfully', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockEvents } });
    mockApiDelete.mockResolvedValue({});
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /deleteicon/i });
      fireEvent.click(deleteButtons[0]);
    });
    
    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith('/events/1');
    });
  });

  test('displays error message on fetch failure', async () => {
    mockApiGet.mockRejectedValue(new Error('API Error'));
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load events/i)).toBeInTheDocument();
    });
  });

  test('refreshes data when refresh button clicked', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockEvents } });
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /refreshicon/i });
      fireEvent.click(refreshButton);
    });
    
    expect(mockApiGet).toHaveBeenCalledTimes(2);
  });

  test('displays status cards with correct counts', async () => {
    mockApiGet.mockResolvedValue({ data: { data: mockEvents } });
    
    render(
      <Router>
        <ManageEventsPage />
      </Router>
    );
    
    await waitFor(() => {
      const upcomingCount = screen.getByText('1', { selector: '.MuiTypography-h4' });
      const completedCount = screen.getByText('1', { selector: '.MuiTypography-h4' });
      
      expect(upcomingCount).toBeInTheDocument();
      expect(completedCount).toBeInTheDocument();
    });
  });
});