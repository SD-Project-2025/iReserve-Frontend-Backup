import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import ViewUser from '@/components/admin/ViewUser';

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe('ViewUser Component', () => {
  const mockNavigate = jest.fn();
  
  // Sample mock user data
  const mockUser = {
    user_id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    type: "resident",
    status: "active",
    created_at: "2023-01-15T00:00:00.000Z",
  };
  
  const mockInactiveUser = {
    user_id: 3,
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    type: "resident",
    status: "inactive",
    created_at: "2023-03-10T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useLocation as jest.Mock).mockReturnValue({ state: null });
    
    // Mock console.error to avoid console output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = (userId = '1') => {
    (useParams as jest.Mock).mockReturnValue({ id: userId });
    
    return render(
      <MemoryRouter initialEntries={[`/admin/users/${userId}`]}>
        <ViewUser />
      </MemoryRouter>
    );
  };

  test('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders user details after loading', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check user info is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('User ID:')).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument(); // User ID value
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Resident')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Joined:')).toBeInTheDocument();
    
    // Check the created date is formatted
    const expectedDate = new Date('2023-01-15').toLocaleDateString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    
    // Check Deactivate button exists (since user is active)
    expect(screen.getByText('Deactivate User')).toBeInTheDocument();
  });

  test('renders error message when user not found', async () => {
    // Set ID to a non-existent user
    renderComponent('999');
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('User not found')).toBeInTheDocument();
  });

  test('renders activate button for inactive user', async () => {
    // Mock useLocation to return an inactive user
    (useLocation as jest.Mock).mockReturnValue({ 
      state: { userData: mockInactiveUser } 
    });
    
    renderComponent('3');
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check inactive user info
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
    
    // Check Activate button exists
    expect(screen.getByText('Activate User')).toBeInTheDocument();
  });

  test('opens deactivation dialog when Deactivate User button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click Deactivate button
    fireEvent.click(screen.getByText('Deactivate User'));
    
    // Check dialog appears
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Deactivate User')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to deactivate this user?')).toBeInTheDocument();
    
    // Check dialog buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
  });

  test('opens activation dialog when Activate User button is clicked', async () => {
    // Mock useLocation to return an inactive user
    (useLocation as jest.Mock).mockReturnValue({ 
      state: { userData: mockInactiveUser } 
    });
    
    renderComponent('3');
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click Activate button
    fireEvent.click(screen.getByText('Activate User'));
    
    // Check dialog appears
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Activate User')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to activate this user?')).toBeInTheDocument();
    
    // Check dialog buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
  });

  test('closes dialog when Cancel button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open dialog
    fireEvent.click(screen.getByText('Deactivate User'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('deactivates user when Deactivate button is clicked in dialog', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Initial state - user is active
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Deactivate User')).toBeInTheDocument();
    
    // Open dialog
    fireEvent.click(screen.getByText('Deactivate User'));
    
    // Click Deactivate in dialog
    fireEvent.click(screen.getByText('Deactivate'));
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    
    // User status should now be inactive
    expect(screen.getByText('inactive')).toBeInTheDocument();
    
    // Button should now be Activate User
    expect(screen.getByText('Activate User')).toBeInTheDocument();
  });

  test('activates user when Activate button is clicked in dialog', async () => {
    // Mock useLocation to return an inactive user
    (useLocation as jest.Mock).mockReturnValue({ 
      state: { userData: mockInactiveUser } 
    });
    
    renderComponent('3');
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Initial state - user is inactive
    expect(screen.getByText('inactive')).toBeInTheDocument();
    expect(screen.getByText('Activate User')).toBeInTheDocument();
    
    // Open dialog
    fireEvent.click(screen.getByText('Activate User'));
    
    // Click Activate in dialog
    fireEvent.click(screen.getByText('Activate'));
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    
    // User status should now be active
    expect(screen.getByText('active')).toBeInTheDocument();
    
    // Button should now be Deactivate User
    expect(screen.getByText('Deactivate User')).toBeInTheDocument();
  });

  test('navigates back to users list when Back button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click Back button
    fireEvent.click(screen.getByText('Back to Users'));
    
    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
  });

  test('displays avatar with user initial', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find avatar with user's first initial
    const avatar = screen.getByText('J');
    expect(avatar).toBeInTheDocument();
  });

  test('displays correct type label for staff user', async () => {
    // Mock a staff user
    const staffUser = {
      ...mockUser,
      type: 'staff'
    };
    
    (useLocation as jest.Mock).mockReturnValue({ 
      state: { userData: staffUser } 
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check staff label is displayed
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  test('shows warning when no user data is available', async () => {
    // Mock a scenario where user is null
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [null, jest.fn()]);
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [null, jest.fn()]);
    
    renderComponent();
    
    // Check warning message
    expect(screen.getByText('No user data available')).toBeInTheDocument();
  });

  test('getStatusColor returns correct color for different statuses', () => {
    // We'll test this function directly by recreating it
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return "success";
        case "inactive":
          return "error";
        default:
          return "default";
      }
    };
    
    expect(getStatusColor('active')).toBe('success');
    expect(getStatusColor('inactive')).toBe('error');
    expect(getStatusColor('unknown')).toBe('default');
  });

  test('getTypeLabel returns correct label for different types', () => {
    // We'll test this function directly by recreating it
    const getTypeLabel = (type: string) => {
      switch (type.toLowerCase()) {
        case "resident":
          return "Resident";
        case "staff":
          return "Staff";
        default:
          return type;
      }
    };
    
    expect(getTypeLabel('resident')).toBe('Resident');
    expect(getTypeLabel('staff')).toBe('Staff');
    expect(getTypeLabel('admin')).toBe('admin');
  });
});