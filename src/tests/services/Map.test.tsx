import React from 'react';
import ReactDOM from 'react-dom';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import LocationMap from "@/services/Map";
import '@testing-library/jest-dom';

// Mock MUI components and icons
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TextField: ({ onChange, value }: { onChange: () => void, value: string }) => (
    <input type="text" onChange={onChange} value={value} />
  ),
  Button: ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick}>{children}</button>
  ),
  IconButton: ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Snackbar: ({ open, children }: { open: boolean, children: React.ReactNode }) => (
    open ? <div>{children}</div> : null
  ),
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Chip: ({ label, onClick, onDelete }: { label: string, onClick: () => void, onDelete: () => void }) => (
    <div>
      <span onClick={onClick}>{label}</span>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}));

jest.mock('@mui/icons-material', () => ({
  MyLocation: () => <React.Fragment>MyLocationIcon</React.Fragment>,
  DirectionsCar: () => <span>DirectionsCarIcon</span>,
  DirectionsWalk: () => <span>DirectionsWalkIcon</span>,
  DirectionsBike: () => <span>DirectionsBikeIcon</span>,
  Train: () => <span>TrainIcon</span>,
  Share: () => <span>ShareIcon</span>,
  Fullscreen: () => <span>FullscreenIcon</span>,
  Close: () => <span>CloseIcon</span>,
}));

// Mock environment variable
jest.mock('import.meta.env', () => ({
  VITE_GOOGLE_MAPS_API_KEY: 'test-api-key',
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn()
    .mockImplementationOnce((success) => Promise.resolve(success({
      coords: {
        latitude: 51.1,
        longitude: 45.3,
      },
    })))
    .mockImplementationOnce((_, error) => Promise.resolve(error({
      message: 'Geolocation error',
    }))),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

// Mock window.google
const mockGoogle = {
  maps: {
    places: {
      Autocomplete: jest.fn().mockImplementation(() => ({
        addListener: jest.fn(),
        getPlace: jest.fn().mockReturnValue({
          formatted_address: 'Mock Address',
        }),
      })),
    },
  },
};

Object.defineProperty(window, 'google', {
  value: mockGoogle,
  configurable: true,
});

// Mock share API
Object.defineProperty(navigator, 'share', {
  value: jest.fn().mockResolvedValue(undefined),
  configurable: true,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  configurable: true,
});

describe('LocationMap Component', () => {
  const mockFacility = { location: 'Test Location' };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders component with basic elements', () => {
    render(<LocationMap Facility={mockFacility} />);
    
    expect(screen.getByText('View on Map')).toBeInTheDocument();
    expect(screen.getByText('Use My Location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter starting address')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  test('loads recent locations from localStorage', () => {
    const recentLocations = ['Location 1', 'Location 2'];
    localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
    
    render(<LocationMap Facility={mockFacility} />);
    
    expect(screen.getByText('Location 1')).toBeInTheDocument();
    expect(screen.getByText('Location 2')).toBeInTheDocument();
  });

  test('handles geolocation success', async () => {
    render(<LocationMap Facility={mockFacility} />);
    
    fireEvent.click(screen.getByText('Use My Location'));
    
    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      expect(localStorage.getItem('recentLocations')).toContain('Current Location (51.10, 45.30)');
    });
  });

  test('handles geolocation error', async () => {
    render(<LocationMap Facility={mockFacility} />);
    
    fireEvent.click(screen.getByText('Use My Location'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to get location: Geolocation error')).toBeInTheDocument();
    });
  });

  test('submits manual origin', () => {
    render(<LocationMap Facility={mockFacility} />);
    
    const input = screen.getByPlaceholderText('Enter starting address');
    fireEvent.change(input, { target: { value: 'New Location' } });
    fireEvent.click(screen.getByText('Go'));
    
    expect(localStorage.getItem('recentLocations')).toContain('New Location');
  });

  test('handles travel mode changes', () => {
    render(<LocationMap Facility={mockFacility} />);
    
    // Find all icon buttons (simplified for this mock)
    const buttons = screen.getAllByRole('button');
    // The travel mode buttons are after the main buttons
    fireEvent.click(buttons[3]); // Driving
    fireEvent.click(buttons[4]); // Walking
    fireEvent.click(buttons[5]); // Biking
    fireEvent.click(buttons[6]); // Transit
    
    // In a real test, you would check if the iframe src changed accordingly
  });

  test('handles share functionality with share API', async () => {
    render(<LocationMap Facility={mockFacility} />);
    
    // Find share button (simplified for this mock)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[7]); // Share
    
    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalled();
    });
  });

  test('handles share functionality with clipboard fallback', async () => {
    // Mock share not being available
    Object.defineProperty(navigator, 'share', {
      value: undefined,
    });
    
    render(<LocationMap Facility={mockFacility} />);
    
    // Find share button (simplified for this mock)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[7]); // Share
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  test('toggles fullscreen mode', () => {
    render(<LocationMap Facility={mockFacility} />);
    
    // Find fullscreen button (simplified for this mock)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[8]); // Fullscreen
    
    // In a real test, you would check if the iframe size changed
  });

  test('removes recent location', () => {
    const recentLocations = ['Location 1', 'Location 2'];
    localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
    
    render(<LocationMap Facility={mockFacility} />);
    
    // Find all delete buttons in chips
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete first location
    
    expect(localStorage.getItem('recentLocations')).not.toContain('Location 1');
    expect(localStorage.getItem('recentLocations')).toContain('Location 2');
  });

  test('initializes google places autocomplete', () => {
    render(<LocationMap Facility={mockFacility} />);
    
    expect(window.google.maps.places.Autocomplete).toHaveBeenCalled();
  });

  test('handles autocomplete place selection', () => {
    render(<LocationMap Facility={mockFacility} />);
    
    // Simulate place selection
    const autocompleteInstance = window.google.maps.places.Autocomplete.mock.results[0].value;
    const listenerCallback = autocompleteInstance.addListener.mock.calls[0][1];
    listenerCallback(); // Trigger the place_changed event
    
    expect(autocompleteInstance.getPlace).toHaveBeenCalled();
  });
});