// @ts-ignore
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import LandingPage from '../LandingPage';
import '@testing-library/jest-dom';

// Mock external dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  useScroll: jest.fn(),
  useTransform: jest.fn(),
  useInView: jest.fn(),
}));

jest.mock('react-parallax', () => ({
  Parallax: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('LandingPage', () => {
  const mockNavigate = jest.fn();
  const mockToggleTheme = jest.fn();
  const mockUseTheme = {
    mode: 'light',
    toggleTheme: mockToggleTheme,
  };

  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useTheme as jest.Mock).mockReturnValue(mockUseTheme);
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when checking auth', () => {
    render(<LandingPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects to dashboard if authenticated', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('mock-token');
    
    render(<LandingPage />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders hero section with correct content', async () => {
    render(<LandingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to iReserve')).toBeInTheDocument();
      expect(screen.getByText(/Discover the perfect way to manage/i)).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  it('toggles theme when theme button is clicked', async () => {
    render(<LandingPage />);
    
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(themeButton);
    
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('navigates to login when login button is clicked', async () => {
    render(<LandingPage />);
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to login when sign up button is clicked', async () => {
    render(<LandingPage />);
    
    const signUpButton = screen.getByText('Sign Up');
    fireEvent.click(signUpButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders community showcase section', async () => {
    render(<LandingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Our Beautiful Community')).toBeInTheDocument();
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });
  });

  it('renders features section with correct content', async () => {
    render(<LandingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Amazing Features')).toBeInTheDocument();
      expect(screen.getByText('Manage Facilities')).toBeInTheDocument();
      expect(screen.getByText('Book Events')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    });
  });

  it('navigates to correct path when feature explore button is clicked', async () => {
    render(<LandingPage />);
    
    await waitFor(() => {
      const facilitiesButton = screen.getByText('Explore', { selector: 'button' });
      fireEvent.click(facilitiesButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/facilities');
    });
  });

  it('renders testimonials section', async () => {
    render(<LandingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('What Our Residents Say')).toBeInTheDocument();
      expect(screen.getAllByText(/★/i).length).toBeGreaterThan(0);
    });
  });

  it('renders call to action section', async () => {
    render(<LandingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
      expect(screen.getAllByText('Sign Up Now').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Login').length).toBeGreaterThan(0);
    });
  });

  it('renders footer with copyright information', async () => {
    render(<LandingPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/© \d{4} iReserve/i)).toBeInTheDocument();
      expect(screen.getByText(/Designed with ❤️/i)).toBeInTheDocument();
    });
  });

  it('handles dark mode styling', async () => {
    (useTheme as jest.Mock).mockReturnValue({
      mode: 'dark',
      toggleTheme: mockToggleTheme,
    });
    
    render(<LandingPage />);
    
    await waitFor(() => {
      const darkModeIcon = screen.getByTestId('LightModeIcon');
      expect(darkModeIcon).toBeInTheDocument();
    });
  });
});