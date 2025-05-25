import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import ManageMaintenancePage from '@/pages/admin/ManageMaintenancePage';
import { api } from '@/services/api';

// Mock API calls
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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
  },
  {
    report_id: 3,
    title: 'Scheduled Repair',
    description: 'Elevator maintenance',
    status: 'scheduled',
    priority: 'low',
    reported_date: '2023-07-18',
    facility_id: 3,
    Facility: {
      facility_id: 3,
      name: 'Main Elevator',
      type: 'Elevator',
      location: 'Lobby'
    },
    reporter: {
      type: 'staff',
      id: 3,
      employee_id: null,
      name: null
    },
    assigned_to: 4,
    scheduled_date: '2023-07-26',
    completion_date: null,
    feedback: null
  },
  {
    report_id: 4,
    title: 'Completed Task',
    description: 'Fixed lighting',
    status: 'completed',
    priority: 'high',
    reported_date: '2023-07-17',
    facility_id: 4,
    Facility: {
      facility_id: 4,
      name: 'Parking Garage',
      type: 'Garage',
      location: 'Basement'
    },
    reporter: null,
    assigned_to: 5,
    scheduled_date: '2023-07-24',
    completion_date: '2023-07-25',
    feedback: 'Great work'
  },
  {
    report_id: 5,
    title: 'Cancelled Task',
    description: 'Cancelled maintenance',
    status: 'cancelled',
    priority: 'medium',
    reported_date: '2023-07-16',
    facility_id: 5,
    Facility: {
      facility_id: 5,
      name: 'Storage Room',
      type: 'Storage',
      location: 'Floor 2'
    },
    reporter: {
      type: 'resident',
      id: 4,
      name: null
    },
    assigned_to: null,
    scheduled_date: null,
    completion_date: null,
    feedback: null
  }
];

describe('ManageMaintenancePage', () => {
  const mockApiGet = api.get as jest.Mock;
  const mockApiPut = api.put as jest.Mock;

  beforeEach(() => {
    mockApiGet.mockResolvedValue({ data: { data: mockReports } });
    mockApiPut.mockResolvedValue({ data: { data: mockReports } });
    mockNavigate.mockClear();
    jest.clearAllMocks();
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

  // Search functionality tests
  test('filters reports by title search term', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: 'AC' } });
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });

  test('filters reports by description search term', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: 'cooling' } });
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });

  test('filters reports by facility name search term', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: 'Kitchen' } });
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
      expect(screen.queryByText('Broken AC')).not.toBeInTheDocument();
    });
  });

  test('filters reports by reporter name search term', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
      expect(screen.queryByText('Broken AC')).not.toBeInTheDocument();
    });
  });

  test('filters reports by employee ID search term', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: 'EMP-001' } });
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });

  test('filters reports by reporter ID search term', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: '2' } });
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });
  });

  test('handles search with empty/null reporter values', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Scheduled Repair')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: '3' } });
    
    await waitFor(() => {
      expect(screen.getByText('Scheduled Repair')).toBeInTheDocument();
    });
  });

  // Filter tests
  test('filters reports by status', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    
    const inProgressOption = screen.getByRole('option', { name: 'In Progress' });
    fireEvent.click(inProgressOption);
    
    await waitFor(() => {
      expect(screen.queryByText('Broken AC')).not.toBeInTheDocument();
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });
  });

  test('filters reports by priority', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    const prioritySelect = screen.getByLabelText('Priority');
    fireEvent.mouseDown(prioritySelect);
    
    const highOption = screen.getByRole('option', { name: 'High' });
    fireEvent.click(highOption);
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });

  test('filters reports by facility', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));
    
    const facilitySelect = screen.getByLabelText('Facility');
    fireEvent.mouseDown(facilitySelect);
    
    await waitFor(() => {
      const conferenceRoomOption = screen.getByRole('option', { name: 'Conference Room A' });
      fireEvent.click(conferenceRoomOption);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });

  // Status update tests
  test('updates report status to in-progress', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Start Work')).toBeInTheDocument();
    });

    const startWorkButton = screen.getByText('Start Work');
    fireEvent.click(startWorkButton);
    
    await waitFor(() => {
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to start work on this maintenance issue?')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/maintenance/1/status', { status: 'in-progress' });
    });
  });

  test('updates report status to scheduled', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    const scheduleButton = screen.getByText('Schedule');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to mark this issue as scheduled?')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/maintenance/2/status', { status: 'scheduled' });
    });
  });

  test('updates report status to completed from in-progress', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const completeButtons = screen.getAllByText('Complete');
      expect(completeButtons.length).toBeGreaterThan(0);
    });

    const completeButtons = screen.getAllByText('Complete');
    fireEvent.click(completeButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to mark this issue as completed?')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/maintenance/2/status', { status: 'completed' });
    });
  });

  test('updates report status to completed from scheduled', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const completeButtons = screen.getAllByText('Complete');
      expect(completeButtons.length).toBeGreaterThan(1);
    });

    const completeButtons = screen.getAllByText('Complete');
    fireEvent.click(completeButtons[1]); // Second complete button (for scheduled item)
    
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to mark this issue as completed?')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/maintenance/3/status', { status: 'completed' });
    });
  });

  test('cancels status update dialog', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Start Work')).toBeInTheDocument();
    });

    const startWorkButton = screen.getByText('Start Work');
    fireEvent.click(startWorkButton);
    
    await waitFor(() => {
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Update Maintenance Status')).not.toBeInTheDocument();
    });
    
    expect(mockApiPut).not.toHaveBeenCalled();
  });

  test('handles status update error', async () => {
    mockApiPut.mockRejectedValueOnce(new Error('Update failed'));
    
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Start Work')).toBeInTheDocument();
    });

    const startWorkButton = screen.getByText('Start Work');
    fireEvent.click(startWorkButton);
    
    await waitFor(() => {
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update maintenance status. Please try again later.')).toBeInTheDocument();
    });
  });

  test('shows processing state during status update', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockApiPut.mockReturnValueOnce(pendingPromise);
    
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Start Work')).toBeInTheDocument();
    });

    const startWorkButton = screen.getByText('Start Work');
    fireEvent.click(startWorkButton);
    
    await waitFor(() => {
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    // Check that buttons are disabled during processing
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });
    
    // Resolve the promise to complete the test
    resolvePromise!({ data: { data: mockReports } });
    
    await waitFor(() => {
      expect(screen.queryByText('Update Maintenance Status')).not.toBeInTheDocument();
    });
  });

  // Navigation tests
  test('navigates to detail page when View button is clicked', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/maintenance/1');
  });

  // Status and Priority color tests - these test the getStatusColor and getPriorityColor functions
  test('displays correct status chip colors for all status types', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('reported')).toBeInTheDocument();
      expect(screen.getByText('in-progress')).toBeInTheDocument();
      expect(screen.getByText('scheduled')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
  });

  test('displays correct priority chip colors for all priority types', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getAllByText('high')).toHaveLength(2);
      expect(screen.getAllByText('medium')).toHaveLength(2);
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  // Reporter display tests - these test the valueGetter function for reported_by column
  test('displays reporter information correctly for all scenarios', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Named reporter
      expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Named reporter
      expect(screen.getByText('Staff: #3')).toBeInTheDocument(); // Staff without employee_id and name
      expect(screen.getByText('Unknown')).toBeInTheDocument(); // Null reporter
      expect(screen.getByText('Resident: #4')).toBeInTheDocument(); // Resident without name
    });
  });

  test('handles unknown status and priority colors', async () => {
    const reportsWithUnknownValues = [
      {
        ...mockReports[0],
        status: 'unknown-status',
        priority: 'unknown-priority'
      }
    ];
    
    mockApiGet.mockResolvedValueOnce({ data: { data: reportsWithUnknownValues } });
    
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('unknown-status')).toBeInTheDocument();
      expect(screen.getByText('unknown-priority')).toBeInTheDocument();
    });
  });

  test('resets filters to show all reports', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    // Set status filter first
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    
    const reportedOption = screen.getByRole('option', { name: 'Reported' });
    fireEvent.click(reportedOption);
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });

    // Reset to all
    fireEvent.mouseDown(statusSelect);
    const allStatusesOption = screen.getByRole('option', { name: 'All Statuses' });
    fireEvent.click(allStatusesOption);
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.getByText('Leaking Faucet')).toBeInTheDocument();
    });
  });

  test('facility dropdown shows facilities in sorted order', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    const facilitySelect = screen.getByLabelText('Facility');
    fireEvent.mouseDown(facilitySelect);
    
    await waitFor(() => {
      const facilityOptions = screen.getAllByRole('option');
      const facilityNames = facilityOptions
        .filter(option => option.textContent !== 'All Facilities')
        .map(option => option.textContent);
      
      // Should be sorted alphabetically
      expect(facilityNames).toEqual([
        'Conference Room A',
        'Main Elevator', 
        'Parking Garage',
        'Staff Kitchen',
        'Storage Room'
      ]);
    });
  });

  test('handles empty search results', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search maintenance reports');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Broken AC')).not.toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });

  test('shows correct action buttons based on status', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      // Reported status should have Start Work button
      expect(screen.getByText('Start Work')).toBeInTheDocument();
      
      // In-progress status should have Schedule and Complete buttons
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getAllByText('Complete')).toHaveLength(2); // in-progress and scheduled both show Complete
      
      // All statuses should have View button
      expect(screen.getAllByText('View')).toHaveLength(5);
    });
  });

  test('closes dialog when onClose is triggered', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Start Work')).toBeInTheDocument();
    });

    const startWorkButton = screen.getByText('Start Work');
    fireEvent.click(startWorkButton);
    
    await waitFor(() => {
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
    });
    
    // Simulate clicking outside dialog or pressing escape
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Update Maintenance Status')).not.toBeInTheDocument();
    });
  });

  test('handles staff reporter with employee_id but no name', async () => {
    const reportsWithStaffNoName = [
      {
        ...mockReports[0],
        reporter: {
          type: 'staff',
          id: 99,
          employee_id: 'EMP-999',
          name: null
        }
      }
    ];
    
    mockApiGet.mockResolvedValueOnce({ data: { data: reportsWithStaffNoName } });
    
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Staff: EMP-999')).toBeInTheDocument();
    });
  });

  test('handles multiple filter combinations', async () => {
    render(
      <Router>
        <ManageMaintenancePage />
      </Router>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
    });

    // Apply status filter
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Reported' }));
    
    // Apply priority filter
    const prioritySelect = screen.getByLabelText('Priority');
    fireEvent.mouseDown(prioritySelect);
    fireEvent.click(screen.getByRole('option', { name: 'High' }));
    
    await waitFor(() => {
      expect(screen.getByText('Broken AC')).toBeInTheDocument();
      expect(screen.queryByText('Leaking Faucet')).not.toBeInTheDocument();
    });
  });
});

// Helper function
function waitForElementToBeRemoved(callback: () => Element | null) {
  return waitFor(() => {
    expect(callback()).not.toBeInTheDocument();
  });
}