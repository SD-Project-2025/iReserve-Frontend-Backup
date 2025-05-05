import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import EventsPage from '@/pages/events/EventsPage';

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

describe('EventsPage', () => {
  const mockNavigate = jest.fn();
  
  const mockEvents = {
    data: {
      data: [
        {
          event_id: 1,
          title: 'Summer Festival',
          description: 'Annual community summer festival with music, food, and games.',
          facility: {
            name: 'Community Park',
            facility_id: 1,
          },
          start_date: '2025-06-15',
          end_date: '2025-06-15',
          start_time: '12:00',
          end_time: '20:00',
          status: 'upcoming',
          image_url: '/festival.jpg',
          max_attendees: 500,
          current_attendees: 250,
        },
        {
          event_id: 2,
          title: 'Yoga Workshop',
          description: 'Learn yoga techniques from professional instructors.',
          facility: {
            name: 'Wellness Center',
            facility_id: 2,
          },
          start_date: '2025-05-10',
          end_date: '2025-05-12',
          start_time: '09:00',
          end_time: '11:00',
          status: 'upcoming',
          image_url: '/yoga.jpg',
          max_attendees: 30,
          current_attendees: 30,
        },
        {
          event_id: 3,
          title: 'Book Club Meeting',
          description: 'Monthly book club discussing "The Great Gatsby".',
          facility: {
            name: 'Library',
            facility_id: 3,
          },
          start_date: '2025-05-05',
          end_date: '2025-05-05',
          start_time: '18:00',
          end_time: '20:00',
          status: 'completed',
          image_url: '/book-club.jpg',
          max_attendees: 20,
          current_attendees: 15,
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  const renderWithRouter = () => {
    return render(
      <BrowserRouter>
        <EventsPage />
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithRouter();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders events after loading', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockEvents);
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Community Events')).toBeInTheDocument();
    expect(screen.getByText('Summer Festival')).toBeInTheDocument();
    expect(screen.getByText('Yoga Workshop')).toBeInTheDocument();
    expect(screen.getByText('Book Club Meeting')).toBeInTheDocument();
  });

  test('shows error alert when events fetch fails', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load events. Please try again later.')).toBeInTheDocument();
    });
  });

  test('filters events when searching', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockEvents);
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    const searchInput = screen.getByLabelText('Search events');
    
    // Search for "Yoga"
    fireEvent.change(searchInput, { target: { value: 'Yoga' } });
    
    // Only Yoga Workshop should be visible now
    expect(screen.getByText('Yoga Workshop')).toBeInTheDocument();
    expect(screen.queryByText('Summer Festival')).not.toBeInTheDocument();
    expect(screen.queryByText('Book Club Meeting')).not.toBeInTheDocument();
    
    // Search for "Library" (facility name)
    fireEvent.change(searchInput, { target: { value: 'Library' } });
    
    // Only Book Club Meeting should be visible now
    expect(screen.queryByText('Yoga Workshop')).not.toBeInTheDocument();
    expect(screen.queryByText('Summer Festival')).not.toBeInTheDocument();
    expect(screen.getByText('Book Club Meeting')).toBeInTheDocument();
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // All events should be visible again
    expect(screen.getByText('Yoga Workshop')).toBeInTheDocument();
    expect(screen.getByText('Summer Festival')).toBeInTheDocument();
    expect(screen.getByText('Book Club Meeting')).toBeInTheDocument();
  });

  test('navigates to event detail page when event card is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockEvents);
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click on the Summer Festival event card
    fireEvent.click(screen.getByText('Summer Festival'));
    
    // Check if navigation happened with correct parameters
    expect(mockNavigate).toHaveBeenCalledWith('/events/1', { state: { id: 1 } });
  });

  test('displays fully booked status for events at capacity', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockEvents);
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // The "Yoga Workshop" event is at capacity (30/30)
    expect(screen.getByText('Fully Booked')).toBeInTheDocument();
    
    // The "Summer Festival" event is not at capacity (250/500)
    expect(screen.getByText('Registration Open')).toBeInTheDocument();
  });

  test('formats date ranges correctly', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockEvents);
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Single-day event (Summer Festival)
    const summerFestivalDate = new Date('2025-06-15').toLocaleDateString();
    expect(screen.getByText(summerFestivalDate)).toBeInTheDocument();
    
    // Multi-day event (Yoga Workshop)
    const yogaStartDate = new Date('2025-05-10').toLocaleDateString();
    const yogaEndDate = new Date('2025-05-12').toLocaleDateString();
    expect(screen.getByText(`${yogaStartDate} - ${yogaEndDate}`)).toBeInTheDocument();
  });

  test('displays "No events found" when search has no results', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockEvents);
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Search for something that doesn't exist
    const searchInput = screen.getByLabelText('Search events');
    fireEvent.change(searchInput, { target: { value: 'NonExistentEvent' } });
    
    // Check for "No events found" message
    expect(screen.getByText('No events found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or check back later for new events.')).toBeInTheDocument();
  });

  test('displays correct event status indicators', async () => {
    (api.get as jest.Mock).mockResolvedValue(mockEvents);
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that status chips are displayed
    expect(screen.getAllByText('upcoming').length).toBe(2);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });
});