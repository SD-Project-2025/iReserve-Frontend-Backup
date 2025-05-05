import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CreateEventPage from '@/pages/admin/CreateEvent';
import { api } from '@/services/api';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('CreateEventPage', () => {
  const mockNavigate = jest.fn();
  
  const mockFacilities = {
    data: {
      data: [
        { facility_id: 1, name: 'Conference Hall', type: 'Indoor', status: 'open', capacity: 100, image_url: '/conference-hall.jpg' },
        { facility_id: 2, name: 'Community Park', type: 'Outdoor', status: 'open', capacity: 500, image_url: '/park.jpg' },
        { facility_id: 3, name: 'Gym', type: 'Fitness', status: 'open', capacity: 50, image_url: '/gym.jpg' },
      ],
    },
  };

  // Add 2 days to current date (matching component's minimum event date logic)
  const getFutureDate = (daysToAdd = 2) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    // Reset timers if any were used
    jest.useRealTimers();
  });

  const renderWithProviders = () => {
    return render(
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CreateEventPage />
        </LocalizationProvider>
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithProviders();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders event creation form after loading facilities', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Create Event')).toBeInTheDocument();
    expect(screen.getByText('Event Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description *')).toBeInTheDocument();
    expect(screen.getByLabelText('Facility *')).toBeInTheDocument();
  });

  test('shows error alert when facilities fetch fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load facilities. Please try again later.')).toBeInTheDocument();
    });
  });

  test('validates first step form fields - title and description', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Try to proceed without filling required fields
    fireEvent.click(screen.getByText('Next'));
    
    // Check for validation errors
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Please select a facility')).toBeInTheDocument();
    
    // Fill in title with too few characters
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Title must be at least 5 characters')).toBeInTheDocument();
    
    // Fix title and add short description
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Test Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'Short' } });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
  });

  test('selects facility and auto-fills capacity and image URL', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Fill in title and description
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Community Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { 
      target: { value: 'This is a community event with more than 10 characters' } 
    });
    
    // Select facility from dropdown
    fireEvent.mouseDown(screen.getByLabelText('Facility *'));
    const option = screen.getByText('Community Park (Outdoor)');
    fireEvent.click(option);
    
    // Proceed to next step
    fireEvent.click(screen.getByText('Next'));
    
    // Verify we're on the next step
    expect(screen.getByText('Schedule & Capacity')).toBeInTheDocument();
    
    // Check that capacity was auto-filled from the selected facility
    expect(screen.getByLabelText('Capacity *')).toHaveValue('500');
  });

  test('validates second step form fields - dates and times', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Fill first step and proceed
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Community Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { 
      target: { value: 'This is a community event with more than 10 characters' } 
    });
    fireEvent.mouseDown(screen.getByLabelText('Facility *'));
    fireEvent.click(screen.getByText('Conference Hall (Indoor)'));
    fireEvent.click(screen.getByText('Next'));
    
    // Try to proceed without filling required fields
    fireEvent.click(screen.getByText('Next'));
    
    // Check for validation errors
    expect(screen.getByText('Start date is required')).toBeInTheDocument();
    expect(screen.getByText('End date is required')).toBeInTheDocument();
    expect(screen.getByText('Start time is required')).toBeInTheDocument();
    expect(screen.getByText('End time is required')).toBeInTheDocument();
    expect(screen.getByText('Valid capacity is required')).toBeInTheDocument();
  });

  test('cancels event creation and navigates back to events page', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  test('can navigate through all form steps', async () => {
    // Mock dates for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
    
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Step 1: Event Details
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Community Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { 
      target: { value: 'This is a community event with more than 10 characters' } 
    });
    fireEvent.mouseDown(screen.getByLabelText('Facility *'));
    fireEvent.click(screen.getByText('Conference Hall (Indoor)'));
    fireEvent.click(screen.getByText('Next'));
    
    // Verify we're on Step 2
    expect(screen.getByText('Schedule & Capacity')).toBeInTheDocument();
    
    // Testing date pickers is complex due to the MUI implementation
    // Here we'll use a simpler approach to test our form validation logic
    
    // Mock the validateStep function to return true for this test
    const originalValidateStep = (CreateEventPage as any).prototype.validateStep;
    (CreateEventPage as any).prototype.validateStep = jest.fn().mockReturnValue(true);
    
    // Navigate to the final step
    fireEvent.click(screen.getByText('Next'));
    
    // Verify we're on Step 3
    expect(screen.getByText('Finalize')).toBeInTheDocument();
    expect(screen.getByText('Public Event (visible to all residents)')).toBeInTheDocument();
    
    // Navigate back to previous step
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Schedule & Capacity')).toBeInTheDocument();
    
    // Navigate back to first step
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Event Details')).toBeInTheDocument();
    
    // Restore original validateStep
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
  });

  test('submits event when all validation passes', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
    
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 1 } });
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // For testing, we'll mock the validateStep to return true
    // This way we can test the submission flow without complex date picker interactions
    const originalValidateStep = (CreateEventPage as any).prototype.validateStep;
    (CreateEventPage as any).prototype.validateStep = jest.fn().mockReturnValue(true);
    
    // Fill required field for first step
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Community Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { 
      target: { value: 'This is a community event with more than 10 characters' } 
    });
    fireEvent.mouseDown(screen.getByLabelText('Facility *'));
    fireEvent.click(screen.getByText('Conference Hall (Indoor)'));
    
    // Navigate through steps
    fireEvent.click(screen.getByText('Next')); // Step 1 -> 2
    fireEvent.click(screen.getByText('Next')); // Step 2 -> 3
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Event'));
    
    // Check that the API was called with the expected payload
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/events', expect.objectContaining({
        title: 'Community Event',
        description: 'This is a community event with more than 10 characters',
        facility_id: 1,
        status: 'upcoming',
        is_public: true,
      }));
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText('An event created successfully!')).toBeInTheDocument();
    });
    
    // Fast-forward timers
    jest.advanceTimersByTime(2000);
    
    // Check navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/events');
    
    // Restore original validateStep
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
  });

  test('shows error when event submission fails', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    (api.post as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: 'Facility is already booked during this time'
        }
      }
    });
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Mock validateStep to return true for testing submission
    const originalValidateStep = (CreateEventPage as any).prototype.validateStep;
    (CreateEventPage as any).prototype.validateStep = jest.fn().mockReturnValue(true);
    
    // Fill required field for first step
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Community Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { 
      target: { value: 'This is a community event with more than 10 characters' } 
    });
    fireEvent.mouseDown(screen.getByLabelText('Facility *'));
    fireEvent.click(screen.getByText('Conference Hall (Indoor)'));
    
    // Navigate through steps
    fireEvent.click(screen.getByText('Next')); // Step 1 -> 2
    fireEvent.click(screen.getByText('Next')); // Step 2 -> 3
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Event'));
    
    // Check error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Facility is already booked during this time')).toBeInTheDocument();
    });
    
    // Check navigation did not occur
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // Restore original validateStep
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
  });

  test('validates registration deadline against event start date', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Fill required fields for first step
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Community Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { 
      target: { value: 'This is a community event with more than 10 characters' } 
    });
    fireEvent.mouseDown(screen.getByLabelText('Facility *'));
    fireEvent.click(screen.getByText('Conference Hall (Indoor)'));
    
    // Navigate to step 2
    fireEvent.click(screen.getByText('Next'));
    
    // Mock that we've filled step 2 correctly
    const originalValidateStep = (CreateEventPage as any).prototype.validateStep;
    let stepValidation = true;
    (CreateEventPage as any).prototype.validateStep = jest.fn(() => stepValidation);
    
    // Navigate to step 3
    fireEvent.click(screen.getByText('Next'));
    
    // Now test step 3 validation specifically
    stepValidation = false;
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
    
    // Try to submit without registration deadline
    fireEvent.click(screen.getByText('Create Event'));
    
    // Check validation error
    expect(screen.getByText('Registration deadline is required')).toBeInTheDocument();
    
    // Restore original validation
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
  });

  test('toggle public event checkbox', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Navigate to step 3 with mocked validation
    const originalValidateStep = (CreateEventPage as any).prototype.validateStep;
    (CreateEventPage as any).prototype.validateStep = jest.fn().mockReturnValue(true);
    
    fireEvent.click(screen.getByText('Next')); // Step 1 -> 2
    fireEvent.click(screen.getByText('Next')); // Step 2 -> 3
    
    // Check initial state of checkbox (should be checked by default)
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    
    // Toggle checkbox
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    
    // Toggle back
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Restore original validation
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
  });

  test('handles fee input changes', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Navigate to step 2
    const originalValidateStep = (CreateEventPage as any).prototype.validateStep;
    (CreateEventPage as any).prototype.validateStep = jest.fn().mockReturnValue(true);
    
    fireEvent.click(screen.getByText('Next')); // Step 1 -> 2
    
    // Check initial fee value
    const feeInput = screen.getByLabelText('Fee (R)');
    expect(feeInput).toHaveValue('0');
    
    // Change fee value
    fireEvent.change(feeInput, { target: { value: '50' } });
    expect(feeInput).toHaveValue('50');
    
    // Restore original validation
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
  });

  test('handles close of success toast', async () => {
    jest.useFakeTimers();
    
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 1 } });
    
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Mock successful submission
    const originalValidateStep = (CreateEventPage as any).prototype.validateStep;
    (CreateEventPage as any).prototype.validateStep = jest.fn().mockReturnValue(true);
    
    // Fill required field for first step
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Community Event' } });
    fireEvent.change(screen.getByLabelText('Description *'), { 
      target: { value: 'This is a community event with more than 10 characters' } 
    });
    fireEvent.mouseDown(screen.getByLabelText('Facility *'));
    fireEvent.click(screen.getByText('Conference Hall (Indoor)'));
    
    // Navigate through steps
    fireEvent.click(screen.getByText('Next')); // Step 1 -> 2
    fireEvent.click(screen.getByText('Next')); // Step 2 -> 3
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Event'));
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText('An event created successfully!')).toBeInTheDocument();
    });
    
    // Close the toast manually
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    // Toast should be gone
    expect(screen.queryByText('An event created successfully!')).not.toBeInTheDocument();
    
    // Navigation should not have happened yet (since we manually closed the toast)
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // Restore original validateStep
    (CreateEventPage as any).prototype.validateStep = originalValidateStep;
  });
});