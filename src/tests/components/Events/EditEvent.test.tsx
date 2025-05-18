import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import EditEvent from '@/components/Events/EditEvent';
import { api } from '@/services/api';

// Mock the API and react-router-dom
jest.mock('@/services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    state: { id: '1' }
  }),
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation(() => '2023-01-01'),
}));

describe('EditEvent Component', () => {
  const mockEvent = {
    event_id: 1,
    title: 'Test Event',
    description: 'Test Description',
    facility_id: 1,
    start_date: new Date('2023-01-01'),
    end_date: new Date('2023-01-02'),
    start_time: '10:00',
    end_time: '12:00',
    organizer_staff_id: 1,
    status: 'upcoming',
    capacity: 100,
    image_url: 'http://test.com/image.jpg',
    is_public: true,
    registration_deadline: new Date('2022-12-25'),
    fee: 50,
  };

  const mockFacilities = [
    { facility_id: 1, name: 'Facility 1' },
    { facility_id: 2, name: 'Facility 2' },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock API responses
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: mockEvent } }) // Event data
      .mockResolvedValueOnce({ data: { data: mockFacilities } }); // Facilities
  });

  test('renders loading state initially', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  test('renders form with event data after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Event Title')).toHaveValue('Test Event');
      expect(screen.getByLabelText('Description')).toHaveValue('Test Description');
      expect(screen.getByText('Facility 1')).toBeInTheDocument();
      expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });
  });

  test('handles form field changes', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const titleInput = screen.getByLabelText('Event Title');
      fireEvent.change(titleInput, { target: { value: 'Updated Event' } });
      expect(titleInput).toHaveValue('Updated Event');

      const descriptionInput = screen.getByLabelText('Description');
      fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
      expect(descriptionInput).toHaveValue('Updated Description');
    });
  });

  test('handles form submission', async () => {
    (api.put as jest.Mock).mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/events/1', expect.any(Object));
    });
  });

  test('displays error when API fails', async () => {
    (api.get as jest.Mock)
      .mockRejectedValueOnce(new Error('API Error'));

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('handles cancel button click', async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(mockNavigate).toHaveBeenCalledWith('/events/1');
    });
  });

  test('displays status chip with correct color', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const statusChip = screen.getByText('upcoming');
      expect(statusChip).toHaveClass('MuiChip-colorPrimary');
    });
  });

  test('handles time and date picker changes', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const startDateInput = screen.getByLabelText('Start Date');
      fireEvent.change(startDateInput, { target: { value: '2023-01-03' } });

      const startTimeInput = screen.getByLabelText('Start Time');
      fireEvent.change(startTimeInput, { target: { value: '11:00' } });
    });
  });
});