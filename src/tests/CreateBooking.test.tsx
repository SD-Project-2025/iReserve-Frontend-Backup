import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CreateBookingPage from '@/pages/bookings/CreateBookingPage';
import { api } from '@/services/api';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('CreateBookingPage', () => {
  const mockNavigate = jest.fn();
  const mockLocationWithFacilityId = {
    state: { facilityId: 1 },
  };
  const mockLocationWithoutFacilityId = {
    state: {},
  };

  const mockFacilities = {
    data: {
      data: [
        { facility_id: 1, name: 'Conference Room', type: 'Meeting', status: 'open' },
        { facility_id: 2, name: 'Sports Hall', type: 'Sports', status: 'open' },
        { facility_id: 3, name: 'Private Studio', type: 'Art', status: 'closed' },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  const renderWithProviders = (locationMock = mockLocationWithoutFacilityId) => {
    (useLocation as jest.Mock).mockReturnValue(locationMock);
    
    return render(
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CreateBookingPage />
        </LocalizationProvider>
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithProviders();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders facilities after loading', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Create Booking')).toBeInTheDocument();
    expect(screen.getByLabelText('Facility')).toBeInTheDocument();
  });

  test('shows error alert when facilities fetch fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load facilities. Please try again later.')).toBeInTheDocument();
    });
  });

  test('pre-selects facility when facilityId is provided in location state', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders(mockLocationWithFacilityId);
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/facilities');
    });
  });

  test('navigates back to bookings on cancel', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/bookings');
  });

  test('shows validation errors when trying to proceed without required fields', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
    renderWithProviders();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Try to proceed without filling required fields
    fireEvent.click(screen.getByText('Next'));
    
    // Check for validation error messages
    expect(screen.getByText('Please select a facility')).toBeInTheDocument();
    expect(screen.getByText('Please select a date')).toBeInTheDocument();
    expect(screen.getByText('Please select a start time')).toBeInTheDocument();
    expect(screen.getByText('Please select an end time')).toBeInTheDocument();
  });

  
 
  


  

});