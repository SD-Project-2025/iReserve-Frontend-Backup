import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ManageMaintenancePage from '@/pages/admin/ManageMaintenancePage';
import { api } from '@/services/api';

// Mock API calls
jest.mock('@/services/api');

const mockReports = [
  {
    report_id: 1,
    title: 'Broken AC',
    description: 'AC not cooling properly',
    status: 'reported',
    priority: 'high',
    reported_date: '2023-07-20',
    facility_id: 1,
    Facility: {
      facility_id: 1,
      name: 'Conference Room A',
      type: 'Room',
      location: 'Floor 5'
    },
    reporter: {
      type: 'staff',
      id: 1,
      employee_id: 'EMP-001',
      name: 'John Doe'
    },
    assigned_to: null,
    scheduled_date: null,
    completion_date: null,
    feedback: null
  },
  {
    report_id: 2,
    title: 'Leaking Faucet',
    description: 'Kitchen faucet leaking',
    status: 'in-progress',
    priority: 'medium',
    reported_date: '2023-07-19',
    facility_id: 2,
    Facility: {
      facility_id: 2,
      name: 'Staff Kitchen',
      type: 'Kitchen',
      location: 'Floor 3'
    },
    reporter: {
      type: 'resident',
      id: 2,
      name: 'Jane Smith'
    },
    assigned_to: 3,
    scheduled_date: '2023-07-25',
    completion_date: null,
    feedback: null
  }
];

describe('ManageMaintenancePage', () => {
  const mockApiGet = api.get as jest.Mock;
  const mockApiPut = api.put as jest.Mock;

  beforeEach(() => {
    mockApiGet.mockResolvedValue({ data: { data: mockReports } });
    mockApiPut.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));
    
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays maintenance reports after loading', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });
  });

  test('filters reports by search term', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const searchInput = screen.getByLabelText('Search maintenance reports');
      fireEvent.change(searchInput, { target: { value: 'AC' } });
      
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });

  test('filters reports by status', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusFilter);
      fireEvent.click(screen.getByText('In Progress'));
      
      expect(screen.queryByText('Broken AC')).not.toBeInTheDocument();
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });
  });

  test('updates report status', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const startWorkButtons = screen.getAllByText('Start Work');
      fireEvent.click(startWorkButtons[0]);
      
      // Confirm dialog
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Confirm'));
      
      expect(mockApiPut).toHaveBeenCalledWith('/maintenance/1/status', { status: 'in-progress' });
    });
  });

  test('displays error message on fetch failure', async () => {
    mockApiGet.mockRejectedValue(new Error('API Error'));
    
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load maintenance reports. Please try again later.')).toBeInTheDocument();
    });
  });

  test('displays correct status chips', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const statusChips = screen.getAllByRole('status-chip');
      expect(statusChips[0]).toHaveTextContent('reported');
      expect(statusChips[0]).toHaveClass('MuiChip-colorInfo');
      
      expect(statusChips[1]).toHaveTextContent('in-progress');
      expect(statusChips[1]).toHaveClass('MuiChip-colorWarning');
    });
  });

  test('shows correct action buttons based on status', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const reportedRowActions = screen.getAllByRole('row')[1];
      expect(reportedRowActions).toHaveTextContent('Start Work');
      
      const inProgressRowActions = screen.getAllByRole('row')[2];
      expect(inProgressRowActions).toHaveTextContent('Schedule');
      expect(inProgressRowActions).toHaveTextContent('Complete');
    });
  });
});