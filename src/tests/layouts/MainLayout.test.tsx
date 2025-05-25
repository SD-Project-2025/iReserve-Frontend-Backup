import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
  Outlet: jest.fn(() => <div>Outlet Content</div>),
}));

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
  useTheme: jest.fn(),
}));

jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/ThemeContext');
jest.mock('@/services/api');
jest.mock('@/assets/logo.svg', () => 'test-logo-path');

describe('MainLayout', () => {
  const mockNavigate = jest.fn();
  const mockLocation = { pathname: '/dashboard' };
  const mockUser = {
    name: 'Test User',
    picture: 'test.jpg',
    type: 'staff',
  };

  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    });
    (useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      toggleTheme: jest.fn(),
    });
    (useMuiTheme as jest.Mock).mockReturnValue({
      breakpoints: { down: jest.fn().mockReturnValue(false) },
      transitions: {
        create: jest.fn(),
        easing: { sharp: '' },
        duration: { leavingScreen: 0, enteringScreen: 0 },
      },
    });
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({ data: { data: { profile: { is_admin: true } } } });
      }
      if (url === '/notifications') {
        return Promise.resolve({ data: { data: [{ id: 1 }] } });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  it('displays user avatar and name', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      expect(screen.getByAltText(mockUser.name)).toBeInTheDocument();
    });
  });

  it('toggles theme when theme button is clicked', async () => {
    const mockToggleTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      mode: 'light',
      toggleTheme: mockToggleTheme,
    });

    render(<MainLayout />);
    await waitFor(() => {
      fireEvent.click(screen.getByLabelText(/switch to dark mode/i));
      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  it('opens and closes profile menu', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /profile/i }));
      expect(screen.getByText('Profile')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Profile'));
    });
  });

  it('logs out when logout is clicked', async () => {
    const mockLogout = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });

    render(<MainLayout />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /profile/i }));
      fireEvent.click(screen.getByText('Logout'));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('shows notification badge', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Notification count
    });
  });

  it('navigates to notifications when notification icon is clicked', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/notifications');
    });
  });

  it('toggles mobile drawer', async () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true); // Simulate mobile
    render(<MainLayout />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /menu/i }));
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows admin menu items for admin users', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /menu/i }));
      expect(screen.getByText('Administration')).toBeInTheDocument();
    });
  });

  it('shows super admin menu items for super admins', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /menu/i }));
      expect(screen.getByText('Super Admin Privileges')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    render(<MainLayout />);
    await waitFor(() => {
      // Verify no error UI is shown (or verify error handling if implemented)
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  it('collapses and expands sidebar on desktop', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      const menuButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(menuButton);
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  it('renders logo and responds to click', async () => {
    render(<MainLayout />);
    await waitFor(() => {
      const logo = screen.getByAltText('iReserve Logo');
      fireEvent.click(logo);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});