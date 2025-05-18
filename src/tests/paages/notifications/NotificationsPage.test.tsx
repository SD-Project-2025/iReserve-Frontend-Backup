//@ts-ignore
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import NotFoundPage from '@/pages/NotFoundPage';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('NotFoundPage', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
  };

  test('renders 404 title and message', () => {
    renderComponent();
    
    // Check for the 404 heading
    expect(screen.getByText('404')).toBeInTheDocument();
    
    // Check for the error message
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText("The page you are looking for doesn't exist or has been moved.")).toBeInTheDocument();
  });

  test('navigates to dashboard when button is clicked', () => {
    renderComponent();
    
    // Find and click the dashboard button
    const dashboardButton = screen.getByText('Go to Dashboard');
    fireEvent.click(dashboardButton);
    
    // Verify navigation was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  test('button is rendered with correct styling', () => {
    renderComponent();
    
    // Get the button
    const button = screen.getByText('Go to Dashboard');
    
    // Check that it's a button element
    expect(button.tagName).toBe('BUTTON');
    
    // Check for contained variant (this is a simple check - in a real test you might want 
    // to check for specific classes or styles, but that would be implementation-specific)
    expect(button).toHaveAttribute('class');
    expect(button.className).toContain('MuiButton-contained');
  });
});