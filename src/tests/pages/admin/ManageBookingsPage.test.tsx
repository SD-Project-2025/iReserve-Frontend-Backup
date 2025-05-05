// __tests__/ManageBookingsPage.test.tsx

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ManageBookingsPage from '@/pages/ManageBookingsPage';
import { BrowserRouter } from 'react-router-dom';
import { api } from '@/services/api';

// Mock the API module
jest.mock('@/services/api');

// Mock useNavigate from react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockBookings = [
  {
    booking_id: 1,
    facility_id: 101,
    resident_id: 201,
    date: '2025-05-04',
    start_time: '10:00',
    end_time: '11:00',
    status: 'pending',
    purpose: 'Meeting',
    attendees: 5,
    created_at: '2025-05-01',
    approved_by: null,
    approval_date: null,
    Facility: {
      facility_id: 101,
      name: 'Conference Room',
      type: 'Room',
      location: 'First Floor',
    },
    Resident: {
      resident_id: 201,
    },
    approver: null,
  },
  // Add more mock bookings as needed
];
test('renders ManageBookingsPage component', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockBookings } });
  
    render(
      <BrowserRouter>
        <ManageBookingsPage />
      </BrowserRouter>
    );
  
    expect(screen.getByText(/Manage Bookings/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Conference Room/i)).toBeInTheDocument());
  });
  
test('displays loading indicator while fetching data', async () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
  
    render(
      <BrowserRouter>
        <ManageBookingsPage />
      </BrowserRouter>
    );
  
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  test('displays error message on API failure', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
  
    render(
      <BrowserRouter>
        <ManageBookingsPage />
      </BrowserRouter>
    );
  
    await waitFor(() => expect(screen.getByText(/Failed to load bookings/i)).toBeInTheDocument());
  });
  test('filters bookings based on search input', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockBookings } });
  
    render(
      <BrowserRouter>
        <ManageBookingsPage />
      </BrowserRouter>
    );
  
    await waitFor(() => expect(screen.getByText(/Conference Room/i)).toBeInTheDocument());
  
    const searchInput = screen.getByLabelText(/Search bookings/i);
    fireEvent.change(searchInput, { target: { value: 'Meeting' } });
  
    expect(screen.getByText(/Conference Room/i)).toBeInTheDocument();
  });
  test('navigates to booking details page on View button click', async () => {
    const navigate = jest.fn();
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockBookings } });
  
    // Override useNavigate mock
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => navigate,
    }));
  
    render(
      <BrowserRouter>
        <ManageBookingsPage />
      </BrowserRouter>
    );
  
    await waitFor(() => expect(screen.getByText(/View/i)).toBeInTheDocument());
  
    fireEvent.click(screen.getByText(/View/i));
    expect(navigate).toHaveBeenCalledWith('/admin/bookings/1');
  });
  test('approves a booking when Approve button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockBookings } });
    (api.put as jest.Mock).mockResolvedValue({});
  
    render(
      <BrowserRouter>
        <ManageBookingsPage />
      </BrowserRouter>
    );
  
    await waitFor(() => expect(screen.getByText(/Approve/i)).toBeInTheDocument());
  
    fireEvent.click(screen.getByText(/Approve/i));
    fireEvent.click(screen.getByText(/Approve Booking/i));
    fireEvent.click(screen.getByText(/^Approve$/i));
  
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/bookings/1/status', { status: 'approved' }));
  });
  test('rejects a booking when Reject button is clicked', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockBookings } });
    (api.put as jest.Mock).mockResolvedValue({});
  
    render(
      <BrowserRouter>
        <ManageBookingsPage />
      </BrowserRouter>
    );
  
    await waitFor(() => expect(screen.getByText(/Reject/i)).toBeInTheDocument());
  
    fireEvent.click(screen.getByText(/Reject/i));
    fireEvent.click(screen.getByText(/Reject Booking/i));
    fireEvent.click(screen.getByText(/^Reject$/i));
  
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/bookings/1/status', { status: 'rejected' }));
  });
  
  
  
  
