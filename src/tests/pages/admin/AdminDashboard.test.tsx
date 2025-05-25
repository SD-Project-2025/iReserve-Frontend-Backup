// AdminDashboard.test.tsx
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import { api } from '@/services/api';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('@/services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  CalendarMonth: () => <div>CalendarIcon</div>,
  SportsTennis: () => <div>SportsIcon</div>,
  Event: () => <div>EventIcon</div>,
  People: () => <div>PeopleIcon</div>,
  SupervisorAccount: () => <div>AdminIcon</div>,
  Add: () => <div>AddIcon</div>,
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    // Mock API responses
    mockApi.get.mockImplementation((url) => {
      switch (url) {
        case '/bookings':
          return Promise.resolve({ 
            data: { data: Array(5).fill({ 
              booking_id: 1, 
              purpose: 'Test Booking',
              attendees: 10,
              date: '2023-01-01',
              start_time: '09:00',
              end_time: '11:00',
              status: 'pending',
              facility: { name: 'Test Facility' }
            })}
          });
        case '/facilities':
          return Promise.resolve({
            data: { data: Array(3).fill({
              facility_id: 1,
              name: 'Test Facility',
              type: 'Gym',
              location: 'Location',
              open_time: '09:00',
              close_time: '17:00',
              status: 'open'
            })}
          });
        case '/maintenance':
          return Promise.resolve({
            data: { data: Array(2).fill({
              report_id: 1,
              title: 'Test Report',
              reported_date: '2023-01-01',
              status: 'reported',
              facility: { name: 'Test Facility' }
            })}
          });
        default:
          return Promise.reject(new Error('not found'));
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
  };

  test('renders main dashboard elements', async () => {
    renderComponent();
    
    // Check main title
    expect(screen.getByRole('heading', { name: /Admin Dashboard/i })).toBeInTheDocument();

    // Check statistics cards
    await waitFor(() => {
      expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
      expect(screen.getByText(/50/i)).toBeInTheDocument(); // Mock user count
      expect(screen.getByText(/Total Facilities/i)).toBeInTheDocument();
      expect(screen.getByText(/3/i)).toBeInTheDocument(); // Mock facility count
    });
  });

  test('displays loading states and then data', async () => {
    renderComponent();

    // Initial loading states
    expect(screen.getAllByRole('progressbar')).toHaveLength(4);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
      expect(screen.getAllByRole('row')).toHaveLength(6); // 5 items + header
    });
  });

  test('handles API errors', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  test('switches tabs correctly', async () => {
    renderComponent();
    
    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Users/i })).toBeInTheDocument();
    });

    // Test tab switching
    const tabs = ['Users', 'Facilities', 'Bookings', 'Maintenance'];
    
    tabs.forEach(async (tabName) => {
      const tab = screen.getByRole('tab', { name: tabName });
      userEvent.click(tab);
      
      await waitFor(() => {
        expect(tab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tabpanel', { name: tabName })).toBeVisible();
      });

      // Verify content in tab panel
      const panel = screen.getByRole('tabpanel', { name: tabName });
      expect(within(panel).getAllByRole('row').length).toBeGreaterThan(1);
    });
  });

  test('navigation buttons work correctly', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    
    renderComponent();

    const buttons = [
      { name: /Manage Users/i, path: '/admin/users' },
      { name: /Manage Facilities/i, path: '/admin/facilities' },
      { name: /Add Facility/i, path: '/admin/facilities/create' },
      { name: /Create Event/i, path: '/admin/events/create' },
    ];

    buttons.forEach(({ name, path }) => {
      const button = screen.getByRole('button', { name });
      userEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith(path);
    });
  });

  test('displays charts with correct data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Booking Trends/i)).toBeInTheDocument();
      expect(screen.getByText(/Facility Usage Statistics/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Chart Placeholder/i)).toHaveLength(2);
    });
  });

  test('displays and interacts with recent activities', async () => {
    renderComponent();

    await waitFor(() => {
      // Check users tab content
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
      
      // Test action buttons
      const viewButtons = screen.getAllByRole('button', { name: /View/i });
      expect(viewButtons.length).toBeGreaterThan(0);
      userEvent.click(viewButtons[0]);
    });
  });
});