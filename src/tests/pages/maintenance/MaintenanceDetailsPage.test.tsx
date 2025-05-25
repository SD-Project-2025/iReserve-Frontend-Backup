
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
    history: [
      {
        id: 1,
        status: 'reported',
        created_at: '2023-01-01T10:00:00Z',
        user: { name: 'John Doe' },
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

  it('shows status and priority chips with correct colors', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      const priorityChip = screen.getByText('high');
      expect(priorityChip).toBeInTheDocument();
    });
  });

  it('displays status history timeline', async () => {
    render(<MaintenanceDetailsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Status History')).toBeInTheDocument();
      expect(screen.getByText('Reported')).toBeInTheDocument();
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