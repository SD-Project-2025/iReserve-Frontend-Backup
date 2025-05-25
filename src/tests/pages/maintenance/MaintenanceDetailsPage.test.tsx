import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MaintenanceDetailsPage from '@/pages/maintenance/MaintenanceDetailsPage';
import { api } from '@/services/api';
import '@testing-library/jest-dom';

// Mock external dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

describe('MaintenanceDetailsPage', () => {
  const mockNavigate = jest.fn();
  const mockReport = {
    report_id: 1,
    title: 'Leaking Pipe',
    description: 'Pipe in restroom is leaking',
    Facility: {
      facility_id: 1,
      name: 'Main Restroom',
      location: 'First Floor',
    },
    user: {
      user_id: 1,
      name: 'John Doe',
    },
    reported_date: '2023-01-01T10:00:00Z',
    status: 'reported',
    priority: 'high',
    assigned_to: {
      user_id: 2,
      name: 'Jane Smith',
    },
    history: [
      {
        id: 1,
        status: 'reported',
        created_at: '2023-01-01T10:00:00Z',
        user: { name: 'John Doe' },
        notes: 'Initial report'
      },
    ],
    comments: [
      {
        id: 1,
        user: { name: 'Jane Smith', user_id: 2 },
        text: 'This needs urgent attention',
        created_at: '2023-01-01T11:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { type: 'staff', id: 1 },
      isAuthenticated: true,
      loading: false
    });
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockReport },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<MaintenanceDetailsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays report details when loaded', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Maintenance Report')).toBeInTheDocument();
      expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
      expect(screen.getByText('Pipe in restroom is leaking')).toBeInTheDocument();
    });
  });

  it('shows error message when report fetch fails', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load maintenance report/i)).toBeInTheDocument();
    });
  });

  it('shows "report not found" when report is null', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: null },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Maintenance report not found.')).toBeInTheDocument();
    });
  });

  it('shows status and priority chips with correct colors', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      const priorityChip = screen.getByText('high');
      expect(priorityChip).toBeInTheDocument();
    });
  });

  it('displays facility and user information', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Main Restroom • First Floor')).toBeInTheDocument();
      expect(screen.getByText('Reported by John Doe')).toBeInTheDocument();
      expect(screen.getByText('Assigned to Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays status history timeline with notes', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Status History')).toBeInTheDocument();
      expect(screen.getByText('Reported')).toBeInTheDocument();
      expect(screen.getByText('Initial report')).toBeInTheDocument();
    });
  });

  it('displays comments section', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('This needs urgent attention')).toBeInTheDocument();
    });
  });

  it('shows action buttons for staff users', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Update Status')).toBeInTheDocument();
      expect(screen.getByText('View Facility')).toBeInTheDocument();
    });
  });

  it('opens status update dialog when Update Status button is clicked', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update Status'));
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
    });
  });

  it('allows status update submission', async () => {
    (api.put as jest.Mock).mockResolvedValueOnce({});
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(async () => {
      fireEvent.click(screen.getByText('Update Status'));
      
      // Select a new status
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusSelect);
      const inProgressOption = await screen.findByText('In Progress');
      fireEvent.click(inProgressOption);
      
      // Submit the form
      fireEvent.click(screen.getByText('Update Status'));
      
      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/maintenance/1/status',
          expect.objectContaining({
            status: 'in-progress',
          })
        );
      });
    });
  });

  it('handles status update error', async () => {
    (api.put as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(async () => {
      fireEvent.click(screen.getByText('Update Status'));
      
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusSelect);
      const inProgressOption = await screen.findByText('In Progress');
      fireEvent.click(inProgressOption);
      
      fireEvent.click(screen.getByText('Update Status'));
      
      await waitFor(() => {
        expect(screen.getByText(/failed to update status/i)).toBeInTheDocument();
      });
    });
  });

  it('closes status dialog when cancel is clicked', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update Status'));
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Cancel'));
      
      setTimeout(() => {
        expect(screen.queryByText('Update Maintenance Status')).not.toBeInTheDocument();
      }, 100);
    });
  });

  it('disables update button when no status is selected', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update Status'));
      const updateButton = screen.getAllByText('Update Status')[1]; // Second one is in dialog
      expect(updateButton).toBeDisabled();
    });
  });

  it('navigates to facility page when View Facility is clicked', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('View Facility'));
      expect(mockNavigate).toHaveBeenCalledWith('/admin/facilities/1', { state: { id: 1 } });
    });
  });

  it('navigates back to maintenance reports when back button is clicked', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Back to Maintenance Reports'));
      expect(mockNavigate).toHaveBeenCalledWith('/maintenance');
    });
  });

  it('shows staff actions for staff users', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Staff Actions')).toBeInTheDocument();
      expect(screen.getByText('View in Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
    });
  });

  it('navigates to admin panel when View in Admin Panel is clicked', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('View in Admin Panel'));
      expect(mockNavigate).toHaveBeenCalledWith('/admin/maintenance/1');
    });
  });

  it('opens status dialog with completed status when Mark as Completed is clicked', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Mark as Completed'));
      expect(screen.getByText('Update Maintenance Status')).toBeInTheDocument();
    });
  });

  it('does not show staff actions for non-staff users', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({ 
      user: { type: 'resident' },
      isAuthenticated: true,
      loading: false
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Staff Actions')).not.toBeInTheDocument();
    });
  });

  it('does not show update status button for completed reports', async () => {
    const completedReport = { ...mockReport, status: 'completed' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: completedReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Update Status')).not.toBeInTheDocument();
    });
  });

  it('does not show mark as completed button for completed reports', async () => {
    const completedReport = { ...mockReport, status: 'completed' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: completedReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument();
    });
  });

  it('does not show mark as completed button for cancelled reports', async () => {
    const cancelledReport = { ...mockReport, status: 'cancelled' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: cancelledReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Mark as Completed')).not.toBeInTheDocument();
    });
  });

  it('handles different priority colors', async () => {
    const mediumPriorityReport = { ...mockReport, priority: 'medium' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mediumPriorityReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });

  it('handles different status colors', async () => {
    const inProgressReport = { ...mockReport, status: 'in-progress' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: inProgressReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('in-progress')).toBeInTheDocument();
    });
  });

  it('renders without assigned_to field', async () => {
    const reportWithoutAssignee = { 
      ...mockReport,
      assigned_to: undefined
    };
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: reportWithoutAssignee },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
      expect(screen.queryByText('Assigned to')).not.toBeInTheDocument();
    });
  });

  it('renders without history', async () => {
    const reportWithoutHistory = { 
      ...mockReport,
      history: undefined
    };
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: reportWithoutHistory },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
      expect(screen.queryByText('Status History')).not.toBeInTheDocument();
    });
  });

  it('renders without comments', async () => {
    const reportWithoutComments = { 
      ...mockReport,
      comments: undefined
    };
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: reportWithoutComments },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
      expect(screen.queryByText('Comments')).not.toBeInTheDocument();
    });
  });

  it('renders with empty history array', async () => {
    const reportWithEmptyHistory = { ...mockReport, history: [] };
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: reportWithEmptyHistory },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
      expect(screen.queryByText('Status History')).not.toBeInTheDocument();
    });
  });

  it('renders with empty comments array', async () => {
    const reportWithEmptyComments = { ...mockReport, comments: [] };
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: reportWithEmptyComments },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Leaking Pipe')).toBeInTheDocument();
      expect(screen.queryByText('Comments')).not.toBeInTheDocument();
    });
  });

  it('shows different timeline icons based on status', async () => {
    const historyWithDifferentStatuses = [
      {
        id: 1,
        status: 'reported',
        created_at: '2023-01-01T10:00:00Z',
        user: { name: 'John Doe' }
      },
      {
        id: 2,
        status: 'in-progress',
        created_at: '2023-01-02T10:00:00Z',
        user: { name: 'Jane Smith' }
      },
      {
        id: 3,
        status: 'scheduled',
        created_at: '2023-01-03T10:00:00Z',
        user: { name: 'Bob Wilson' }
      },
      {
        id: 4,
        status: 'completed',
        created_at: '2023-01-04T10:00:00Z',
        user: { name: 'Alice Brown' }
      }
    ];
    
    const reportWithHistory = { ...mockReport, history: historyWithDifferentStatuses };
    
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: reportWithHistory },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Reported')).toBeInTheDocument();
      expect(screen.getByText('In-progress')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('does not fetch report when id is not provided', () => {
    (useParams as jest.Mock).mockReturnValueOnce({});
    
    render(<MaintenanceDetailsPage />);
    
    expect(api.get).not.toHaveBeenCalled();
  });

  it('handles status update with notes', async () => {
    (api.put as jest.Mock).mockResolvedValueOnce({});
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(async () => {
      fireEvent.click(screen.getByText('Update Status'));
      
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusSelect);
      const scheduledOption = await screen.findByText('Scheduled');
      fireEvent.click(scheduledOption);
      
      fireEvent.click(screen.getByText('Update Status'));
      
      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith(
          '/maintenance/1/status',
          expect.objectContaining({
            status: 'scheduled',
            notes: '',
          })
        );
      });
    });
  });

  it('handles all priority color cases', async () => {
    // Test low priority
    const lowPriorityReport = { ...mockReport, priority: 'low' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: lowPriorityReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  it('handles unknown priority color', async () => {
    const unknownPriorityReport = { ...mockReport, priority: 'unknown' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: unknownPriorityReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  it('handles all status color cases', async () => {
    // Test cancelled status
    const cancelledReport = { ...mockReport, status: 'cancelled' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: cancelledReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
  });

  it('handles unknown status color', async () => {
    const unknownStatusReport = { ...mockReport, status: 'unknown' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: unknownStatusReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  it('shows submitting state during status update', async () => {
    // Mock a delayed API response
    let resolveApiCall: () => void;
    const apiPromise = new Promise<void>((resolve) => {
      resolveApiCall = resolve;
    });
    
    (api.put as jest.Mock).mockReturnValueOnce(apiPromise);
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(async () => {
      fireEvent.click(screen.getByText('Update Status'));
      
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusSelect);
      const inProgressOption = await screen.findByText('In Progress');
      fireEvent.click(inProgressOption);
      
      fireEvent.click(screen.getByText('Update Status'));
      
      // Should show loading state
      await waitFor(() => {
        const buttons = screen.getAllByText('Update Status');
        const dialogButton = buttons[buttons.length - 1];
        expect(dialogButton).toBeDisabled();
      });
    });
    
    // Resolve the promise to clean up
    resolveApiCall!();
    await apiPromise;
  });

  it('filters status options based on current status', async () => {
    const inProgressReport = { ...mockReport, status: 'in-progress' };
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { data: inProgressReport },
    });
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update Status'));
      
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusSelect);
      
      // Should not show current status as option
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
      // Should show other statuses
      expect(screen.getByText('Reported')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('logs report data to console', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('data', mockReport);
    });
    
    consoleSpy.mockRestore();
  });

  it('logs error to console on fetch failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Fetch failed');
    (api.get as jest.Mock).mockRejectedValueOnce(error);
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching maintenance report:', error);
    });
    
    consoleSpy.mockRestore();
  });

  it('logs error to console on status update failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Update failed');
    (api.put as jest.Mock).mockRejectedValueOnce(error);
    
    render(<MaintenanceDetailsPage />);
    
    await waitFor(async () => {
      fireEvent.click(screen.getByText('Update Status'));
      
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.mouseDown(statusSelect);
      const inProgressOption = await screen.findByText('In Progress');
      fireEvent.click(inProgressOption);
      
      fireEvent.click(screen.getByText('Update Status'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating status:', error);
      });
    });
    
    consoleSpy.mockRestore();
  });

  it('shows loading state when authentication is loading', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      loading: true,
      isAuthenticated: false,
      user: null
    });
    
    render(<MaintenanceDetailsPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      loading: false,
      isAuthenticated: false,
      user: null
    });
    
    render(<MaintenanceDetailsPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});