import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '@/pages/profile/ProfilePage';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ProfilePage', () => {
  // Mock user data
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    type: 'resident',
    picture: 'https://example.com/avatar.jpg',
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the default mock for useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  const renderComponent = () => {
    return render(<ProfilePage />);
  };

  test('renders user profile information correctly', () => {
    renderComponent();
    
    // Check user information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Resident Account')).toBeInTheDocument();
    
    // Check avatar with correct alt text
    const avatar = screen.getByAltText('John Doe');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    
    // Check page title
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  test('renders form fields with correct values', () => {
    renderComponent();
    
    // Check form fields
    expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Email')).toHaveValue('john.doe@example.com');
    expect(screen.getByLabelText('Phone Number')).toHaveValue('');
    expect(screen.getByLabelText('Address')).toHaveValue('');
    
    // Check disabled fields
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    
    // Check helper text for disabled fields
    expect(screen.getByText('Name cannot be changed (managed by Google)')).toBeInTheDocument();
    expect(screen.getByText('Email cannot be changed (managed by Google)')).toBeInTheDocument();
  });

  test('allows editing phone number and address fields', () => {
    renderComponent();
    
    // Check fields are editable by changing values
    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });
    expect(phoneInput).toHaveValue('123-456-7890');
    
    const addressInput = screen.getByLabelText('Address');
    fireEvent.change(addressInput, { target: { value: '123 Main St, Anytown, USA' } });
    expect(addressInput).toHaveValue('123 Main St, Anytown, USA');
  });

  test('shows loading indicator when form is submitted', async () => {
    renderComponent();
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '123 Main St, Anytown, USA' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // After timeout, success message should appear
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    }, { timeout: 1100 }); // A bit more than the 1000ms timeout in the component
    
    // Loading indicator should be gone
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('shows success message after successful update', async () => {
    renderComponent();
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '123-456-7890' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // After timeout, success message should appear
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    }, { timeout: 1100 });
  });

  test('calls logout function when logout button is clicked', () => {
    renderComponent();
    
    // Click logout button
    fireEvent.click(screen.getByText('Logout'));
    
    // Check logout function was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('renders account settings section', () => {
    renderComponent();
    
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Your account is managed through Google. For security settings, please visit your Google account settings.')).toBeInTheDocument();
  });

  test('handles form submission correctly', async () => {
    renderComponent();
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '123 Main St, Anytown, USA' } });
    
    // Mock the form submission event
    const mockPreventDefault = jest.fn();
    const mockSubmitEvent = {
      preventDefault: mockPreventDefault
    };
    
    // Spy on console.error 
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Get the form and trigger submit event
    const form = screen.getByText('Save Changes').closest('form');
    fireEvent.submit(form!, mockSubmitEvent);
    
    // Check preventDefault was called
    expect(mockPreventDefault).toHaveBeenCalledTimes(1);
    
    // After timeout, success message should appear
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    }, { timeout: 1100 });
  });

  test('handles error during form submission', async () => {
    renderComponent();
    
    // Mock implementation to throw an error
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = jest.fn().mockImplementation((callback) => {
      callback();
      throw new Error('Network error');
    }) as any;
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Error should be logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    
    // Restore original setTimeout
    window.setTimeout = originalSetTimeout;
  });

  test('handles missing user data gracefully', () => {
    // Mock null user data
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: mockLogout,
    });
    
    renderComponent();
    
    // Should render with default empty values
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('');
    
    // Avatar should show with default alt text
    expect(screen.getByAltText('User')).toBeInTheDocument();
  });

  test('button is disabled during form submission', async () => {
    renderComponent();
    
    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Button should be disabled
    expect(screen.getByText('Save Changes').closest('button')).toBeDisabled();
    
    // After timeout, button should be enabled again
    await waitFor(() => {
      expect(screen.getByText('Save Changes').closest('button')).not.toBeDisabled();
    }, { timeout: 1100 });
  });
});