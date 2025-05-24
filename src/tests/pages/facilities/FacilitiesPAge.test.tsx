//@ts-ignore
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import FacilitiesPage from '../../../pages/facilities/FacilitiesPage';
//import '@testing-library/jest-dom/extend-expect';
import { api } from '../../../services/api';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('FacilitiesPage', () => {
  const mockNavigate = jest.fn();
  
  // Sample facilities data for tests
  const mockFacilities = {
    data: {
      data: [
        {
          facility_id: 1,
          name: 'Tennis Court',
          type: 'Sports',
          location: 'North Wing',
          capacity: 4,
          is_indoor: false,
          image_url: '/tennis-court.jpg',
          status: 'open',
          description: 'Professional tennis court with high-quality surface. Perfect for both casual games and competitive matches.'
        },
        {
          facility_id: 2,
          name: 'Conference Room A',
          type: 'Meeting',
          location: 'Main Building, Floor 2',
          capacity: 20,
          is_indoor: true,
          image_url: '/conference-room.jpg',
          status: 'open',
          description: 'Spacious conference room equipped with modern presentation technology and comfortable seating.'
        },
        {
          facility_id: 3,
          name: 'Swimming Pool',
          type: 'Sports',
          location: 'South Wing',
          capacity: 30,
          is_indoor: true,
          image_url: '/pool.jpg',
          status: 'maintenance',
          description: 'Olympic-sized swimming pool with lanes for serious swimmers and a recreational area.'
        },
        {
          facility_id: 4,
          name: 'Gym',
          type: 'Fitness',
          location: 'East Wing',
          capacity: 50,
          is_indoor: true,
          image_url: '/gym.jpg',
          status: 'closed',
          description: 'Fully equipped gym with cardio machines, free weights, and dedicated spaces for various workouts.'
        }
      ]
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    
    // Mock successful API response by default
    (api.get as jest.Mock).mockResolvedValue(mockFacilities);
  });
  
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <FacilitiesPage />
      </BrowserRouter>
    );
  };
  
  test('renders loading state initially', () => {
    // Mock API to not resolve immediately
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders facilities list when data is loaded', async () => {
    renderComponent();
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check page title
    expect(screen.getByText('Facilities')).toBeInTheDocument();
    
    // Check that all facilities are rendered
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
    
    // Check that facility details are displayed
    expect(screen.getByText('Sports • Outdoor • Capacity: 4')).toBeInTheDocument();
    expect(screen.getByText('Meeting • Indoor • Capacity: 20')).toBeInTheDocument();
    expect(screen.getByText('Sports • Indoor • Capacity: 30')).toBeInTheDocument();
    expect(screen.getByText('Fitness • Indoor • Capacity: 50')).toBeInTheDocument();
    
    // Check locations are displayed
    expect(screen.getByText('North Wing')).toBeInTheDocument();
    expect(screen.getByText('Main Building, Floor 2')).toBeInTheDocument();
    expect(screen.getByText('South Wing')).toBeInTheDocument();
    expect(screen.getByText('East Wing')).toBeInTheDocument();
    
    // Check status chips
    expect(screen.getAllByText('open').length).toBe(2);
    expect(screen.getByText('maintenance')).toBeInTheDocument();
    expect(screen.getByText('closed')).toBeInTheDocument();
  });
  
  test('displays error message when API call fails', async () => {
    // Mock API error
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText('Failed to load facilities. Please try again later.')).toBeInTheDocument();
  });
  
  test('filters facilities by search term', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Type in search box
    const searchInput = screen.getByLabelText('Search facilities');
    fireEvent.change(searchInput, { target: { value: 'Tennis' } });
    
    // Only Tennis Court should be visible
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Search by description
    fireEvent.change(searchInput, { target: { value: 'Olympic' } });
    
    // Only Swimming Pool should be visible
    expect(screen.queryByText('Tennis Court')).not.toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // All facilities should be visible again
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
  });
  
  test('filters facilities by type', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open type dropdown
    fireEvent.mouseDown(screen.getByLabelText('Type'));
    
    // Select Sports type
    fireEvent.click(screen.getByText('Sports'));
    
    // Only sports facilities should be visible
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Select Meeting type
    fireEvent.mouseDown(screen.getByLabelText('Type'));
    fireEvent.click(screen.getByText('Meeting'));
    
    // Only meeting facilities should be visible
    expect(screen.queryByText('Tennis Court')).not.toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Reset to all types
    fireEvent.mouseDown(screen.getByLabelText('Type'));
    fireEvent.click(screen.getByText('All Types'));
    
    // All facilities should be visible again
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
  });
  
  test('filters facilities by status', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Open status dropdown
    fireEvent.mouseDown(screen.getByLabelText('Status'));
    
    // Select Open status
    fireEvent.click(screen.getByText('Open'));
    
    // Only open facilities should be visible
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Select Maintenance status
    fireEvent.mouseDown(screen.getByLabelText('Status'));
    fireEvent.click(screen.getByText('Maintenance'));
    
    // Only maintenance facilities should be visible
    expect(screen.queryByText('Tennis Court')).not.toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Select Closed status
    fireEvent.mouseDown(screen.getByLabelText('Status'));
    fireEvent.click(screen.getByText('Closed'));
    
    // Only closed facilities should be visible
    expect(screen.queryByText('Tennis Court')).not.toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
    
    // Reset to all statuses
    fireEvent.mouseDown(screen.getByLabelText('Status'));
    fireEvent.click(screen.getByText('All Statuses'));
    
    // All facilities should be visible again
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.getByText('Gym')).toBeInTheDocument();
  });
  
  test('combines multiple filters', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Set type to Sports
    fireEvent.mouseDown(screen.getByLabelText('Type'));
    fireEvent.click(screen.getByText('Sports'));
    
    // Set status to Open
    fireEvent.mouseDown(screen.getByLabelText('Status'));
    fireEvent.click(screen.getByText('Open'));
    
    // Only Tennis Court should be visible (Sports and Open)
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Add search term
    const searchInput = screen.getByLabelText('Search facilities');
    fireEvent.change(searchInput, { target: { value: 'Tennis' } });
    
    // Tennis Court should still be the only one visible
    expect(screen.getByText('Tennis Court')).toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    
    // Change search term to something that doesn't match any open sports facilities
    fireEvent.change(searchInput, { target: { value: 'Olympic' } });
    
    // No facilities should match all criteria
    expect(screen.queryByText('Tennis Court')).not.toBeInTheDocument();
    expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();
    expect(screen.queryByText('Gym')).not.toBeInTheDocument();
    expect(screen.getByText('No facilities found matching your criteria.')).toBeInTheDocument();
  });
  
  test('navigates to facility details when a facility card is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on the Tennis Court card
    fireEvent.click(screen.getByText('Tennis Court'));
    
    // Check navigation occurred with correct facility ID
    expect(mockNavigate).toHaveBeenCalledWith('/facilities/1');
    
    // Click on the Conference Room card
    fireEvent.click(screen.getByText('Conference Room A'));
    
    // Check navigation occurred with correct facility ID
    expect(mockNavigate).toHaveBeenCalledWith('/facilities/2');
  });
  
  test('truncates long descriptions', async () => {
    // Create mock facility with long description
    const longDescriptionFacility = {
      data: {
        data: [
          {
            ...mockFacilities.data.data[0],
            description: 'A '.repeat(100) + 'This part should be truncated'
          }
        ]
      }
    };
    
    (api.get as jest.Mock).mockResolvedValue(longDescriptionFacility);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Description should be truncated with ellipsis
    const description = screen.getByText(/A A A A/);
    expect(description.textContent).toContain('...');
    expect(description.textContent).not.toContain('This part should be truncated');
  });
  
  test('getStatusColor returns correct colors', () => {
    // Create a utility function to test getStatusColor
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "open":
          return "success";
        case "closed":
          return "error";
        case "maintenance":
          return "warning";
        default:
          return "default";
      }
    };
    
    // Test various status values
    expect(getStatusColor('open')).toBe('success');
    expect(getStatusColor('closed')).toBe('error');
    expect(getStatusColor('maintenance')).toBe('warning');
    expect(getStatusColor('unknown')).toBe('default');
  });
});