//@ts-ignore
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
//@ts-ignore
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

// Mock DatePicker and TimePicker components
jest.mock('@mui/x-date-pickers/DatePicker', () => ({ onChange, value, label }: any) => (
  <input
    aria-label={label}
    type="date"
    value={value.toISOString().split('T')[0]}
    onChange={(e) => {
      const date = new Date(e.target.value);
      onChange(date);
    }}
    data-testid="date-picker"
  />
));

jest.mock('@mui/x-date-pickers/TimePicker', () => ({ onChange, value, label }: any) => (
  <input
    aria-label={label}
    type="time"
    value={value}
    onChange={(e) => {
      onChange(e.target.value);
    }}
    data-testid="time-picker"
  />
));

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
    jest.clearAllMocks();
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: mockEvent } })
      .mockResolvedValueOnce({ data: { data: mockFacilities } });
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

  test('handles form submission with formatted dates', async () => {
    (api.put as jest.Mock).mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/events/1',
        expect.objectContaining({
          start_date: '2023-01-01',
          end_date: '2023-01-02',
          registration_deadline: '2022-12-25',
        })
      );
    });
  });

  test('handles submit error', async () => {
    (api.put as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('displays error when API fails', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

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
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockNavigate).toHaveBeenCalledWith('/events/1');
    });
  });

  test('displays correct status color for ongoing event', async () => {
    const ongoingEvent = { ...mockEvent, status: 'ongoing' };
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: ongoingEvent } })
      .mockResolvedValueOnce({ data: { data: mockFacilities } });

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const statusChip = screen.getByText('ongoing');
      expect(statusChip).toHaveClass('MuiChip-colorWarning');
    });
  });

  test('displays correct status color for completed event', async () => {
    const completedEvent = { ...mockEvent, status: 'completed' };
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: completedEvent } })
      .mockResolvedValueOnce({ data: { data: mockFacilities } });

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const statusChip = screen.getByText('completed');
      expect(statusChip).toHaveClass('MuiChip-colorSuccess');
    });
  });

  test('displays correct status color for cancelled event', async () => {
    const cancelledEvent = { ...mockEvent, status: 'cancelled' };
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: { data: cancelledEvent } })
      .mockResolvedValueOnce({ data: { data: mockFacilities } });

    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const statusChip = screen.getByText('cancelled');
      expect(statusChip).toHaveClass('MuiChip-colorError');
    });
  });

  test('toggles is_public switch', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const switchElement = screen.getByRole('checkbox', { name: /Public Event/ });
      expect(switchElement).toBeChecked();
      fireEvent.click(switchElement);
      expect(switchElement).not.toBeChecked();
    });
  });

  test('updates fee and capacity fields', async () => {
    render(
      <MemoryRouter initialEntries={['/events/1/edit']}>
        <Routes>
          <Route path="/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const capacityInput = screen.getByLabelText('Capacity');
      fireEvent.change(capacityInput, { target: { value: '200' } });
      expect(capacityInput).toHaveValue(200);

      const feeInput = screen.getByLabelText('Fee');
      fireEvent.change(feeInput, { target: { value: '100' } });
      expect(feeInput).toHaveValue(100);
    });
  });

  test('handles date and time picker changes', async () => {
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
      expect(startDateInput).toHaveValue('2023-01-03');

      const startTimeInput = screen.getByLabelText('Start Time');
      fireEvent.change(startTimeInput, { target: { value: '11:00' } });
      expect(startTimeInput).toHaveValue('11:00');

      const registrationDeadlineInput = screen.getByLabelText('Registration Deadline');
      fireEvent.change(registrationDeadlineInput, { target: { value: '2022-12-30' } });
      expect(registrationDeadlineInput).toHaveValue('2022-12-30');
    });
  });
  // Add these tests to your existing test file

test('handles submission errors with error message', async () => {
  (api.put as jest.Mock).mockRejectedValueOnce({
    response: { data: { message: 'Update failed' } }
  });

  render(
    <MemoryRouter initialEntries={['/events/1/edit']}>
      <Routes>
        <Route path="/events/:id/edit" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(async () => {
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Update failed');
    });
  });
});

test('handles submission errors without response', async () => {
  (api.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

  render(
    <MemoryRouter initialEntries={['/events/1/edit']}>
      <Routes>
        <Route path="/events/:id/edit" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(async () => {
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('An unexpected error occurred');
    });
  });
});

test('handles facility selection change', async () => {
  render(
    <MemoryRouter initialEntries={['/events/1/edit']}>
      <Routes>
        <Route path="/events/:id/edit" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => {
    const facilitySelect = screen.getByLabelText('Facility');
    fireEvent.mouseDown(facilitySelect);
    const facilityOption = screen.getByText('Facility 2');
    fireEvent.click(facilityOption);
    expect(screen.getByText('Facility 2')).toBeInTheDocument();
  });
});

test('handles status selection change', async () => {
  render(
    <MemoryRouter initialEntries={['/events/1/edit']}>
      <Routes>
        <Route path="/events/:id/edit" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => {
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    const statusOption = screen.getByText('Ongoing');
    fireEvent.click(statusOption);
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
  });
});

test('handles minimum capacity and fee values', async () => {
  render(
    <MemoryRouter initialEntries={['/events/1/edit']}>
      <Routes>
        <Route path="/events/:id/edit" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => {
    const capacityInput = screen.getByLabelText('Capacity');
    fireEvent.change(capacityInput, { target: { value: '0' }});
    expect(capacityInput).toHaveValue(0);

    const feeInput = screen.getByLabelText('Fee');
    fireEvent.change(feeInput, { target: { value: '0' }});
    expect(feeInput).toHaveValue(0);
  });
});

test('handles date picker cleanup on unmount', async () => {
  const { unmount } = render(
    <MemoryRouter initialEntries={['/events/1/edit']}>
      <Routes>
        <Route path="/events/:id/edit" element={<EditEvent />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => {
    unmount();
    expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument();
  });
});
});