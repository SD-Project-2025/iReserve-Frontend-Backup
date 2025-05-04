
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter} from 'react-router-dom';
import ViewUser from '@/components/admin/ViewUser';
import '@testing-library/jest-dom';

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock MUI components that might cause issues in tests
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  CircularProgress: () => <div>CircularProgress</div>,
}));

describe('ViewUser Component', () => {
 

  const mockNavigate = jest.fn();
  const mockUseLocation = {
    state: null,
    pathname: '',
    search: '',
    hash: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('react-router-dom').useParams.mockReturnValue({ id: '1' });
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    require('react-router-dom').useLocation.mockReturnValue(mockUseLocation);
  });

  test('renders loading state initially', () => {
    render(
      <MemoryRouter initialEntries={['/users/1']}>
        <ViewUser />
      </MemoryRouter>
    );

    expect(screen.getByText('CircularProgress')).toBeInTheDocument();
  });

  test('displays user data after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/users/1']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('User ID: 1')).toBeInTheDocument();
      expect(screen.getByText('Type: Resident')).toBeInTheDocument();
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  test('shows error message when user not found', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: '999' });

    render(
      <MemoryRouter initialEntries={['/users/999']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  test('navigates back when back button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/users/1']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      const backButton = screen.getByText('Back to Users');
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  test('opens deactivate dialog for active user', async () => {
    render(
      <MemoryRouter initialEntries={['/users/1']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      const deactivateButton = screen.getByText('Deactivate User');
      fireEvent.click(deactivateButton);
      expect(screen.getByText('Deactivate User')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to deactivate this user?')).toBeInTheDocument();
    });
  });

  test('opens activate dialog for inactive user', async () => {
    require('react-router-dom').useParams.mockReturnValue({ id: '3' });

    render(
      <MemoryRouter initialEntries={['/users/3']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      const activateButton = screen.getByText('Activate User');
      fireEvent.click(activateButton);
      expect(screen.getByText('Activate User')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to activate this user?')).toBeInTheDocument();
    });
  });

  test('updates user status when confirmed in dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/users/1']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(async () => {
      const deactivateButton = screen.getByText('Deactivate User');
      fireEvent.click(deactivateButton);

      const confirmButton = screen.getByText('Deactivate');
      fireEvent.click(confirmButton);

      // Wait for status to update
      await waitFor(() => {
        expect(screen.getByText('inactive')).toBeInTheDocument();
      });
    });
  });

  test('uses user data from location state if available', async () => {
    const mockLocationWithState = {
      ...mockUseLocation,
      state: {
        userData: {
          user_id: 100,
          name: 'Location State User',
          email: 'location@example.com',
          type: 'staff',
          status: 'inactive',
          created_at: '2023-01-01T00:00:00.000Z',
        },
      },
    };

    require('react-router-dom').useLocation.mockReturnValue(mockLocationWithState);

    render(
      <MemoryRouter initialEntries={['/users/1']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Location State User')).toBeInTheDocument();
      expect(screen.getByText('location@example.com')).toBeInTheDocument();
      expect(screen.getByText('Type: Staff')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });
  });

  test('displays correct status chip color', async () => {
    render(
      <MemoryRouter initialEntries={['/users/1']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      const activeChip = screen.getByText('active');
      expect(activeChip).toHaveClass('MuiChip-colorSuccess');
    });

    require('react-router-dom').useParams.mockReturnValue({ id: '3' });

    render(
      <MemoryRouter initialEntries={['/users/3']}>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      const inactiveChip = screen.getByText('inactive');
      expect(inactiveChip).toHaveClass('MuiChip-colorError');
    });
  });
});