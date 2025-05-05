import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddFacility from '@/pages/admin/AddFacility';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Mock the API and Auth context
jest.mock('@/services/api');
jest.mock('@/contexts/AuthContext');

const mockApi = api as jest.Mocked<typeof api>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AddFacility', () => {
  const mockStaffUser = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    type: 'staff',
    status: 'active'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock auth context
    mockUseAuth.mockReturnValue({
      user: mockStaffUser,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    // Mock API responses
    mockApi.get.mockResolvedValue({ data: { conflicts: { name: false, location: false } } });
    mockApi.post.mockResolvedValue({ status: 201, data: {} });
  });

  test('renders the form with all fields', () => {
    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Location *')).toBeInTheDocument();
    expect(screen.getByLabelText('Type *')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Capacity *')).toBeInTheDocument();
    expect(screen.getByLabelText('Indoor Facility')).toBeInTheDocument();
    expect(screen.getByLabelText('Opening Time *')).toBeInTheDocument();
    expect(screen.getByLabelText('Closing Time *')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('redirects unauthorized users', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    // Mock non-staff user
    mockUseAuth.mockReturnValueOnce({
      user: { ...mockStaffUser, type: 'resident' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/unauthorized');
  });

  test('validates required fields', async () => {
    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Add Facility'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Type is required')).toBeInTheDocument();
      expect(screen.getByText('Location is required')).toBeInTheDocument();
      expect(screen.getByText('Valid capacity is required')).toBeInTheDocument();
      expect(screen.getByText('Opening time is required')).toBeInTheDocument();
      expect(screen.getByText('Closing time is required')).toBeInTheDocument();
    });
  });

  test('checks for name and location conflicts', async () => {
    // Mock API to return conflicts
    mockApi.get.mockResolvedValueOnce({ 
      data: { conflicts: { name: true, location: true } } 
    });

    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test Facility' } });
    fireEvent.change(screen.getByLabelText('Location *'), { target: { value: 'Test Location' } });

    await waitFor(() => {
      expect(screen.getByText('Name already in use')).toBeInTheDocument();
      expect(screen.getByText('Location already in use')).toBeInTheDocument();
    });
  });

  test('submits the form successfully', async () => {
    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test Facility' } });
    fireEvent.change(screen.getByLabelText('Location *'), { target: { value: 'Test Location' } });
    fireEvent.mouseDown(screen.getByLabelText('Type *'));
    fireEvent.click(screen.getByText('Auditorium'));
    fireEvent.change(screen.getByLabelText('Capacity *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Opening Time *'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Closing Time *'), { target: { value: '17:00' } });

    fireEvent.click(screen.getByText('Add Facility'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/facilities', {
        name: 'Test Facility',
        type: 'Auditorium',
        location: 'Test Location',
        capacity: 100,
        image_url: '',
        is_indoor: true,
        description: '',
        open_time: '09:00:00',
        close_time: '17:00:00',
        status: 'open',
      });
    });

    expect(screen.getByText('Facility added successfully!')).toBeInTheDocument();
  });

  test('handles submission errors', async () => {
    mockApi.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'A facility with this name already exists'
        }
      }
    });

    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test Facility' } });
    fireEvent.change(screen.getByLabelText('Location *'), { target: { value: 'Test Location' } });
    fireEvent.mouseDown(screen.getByLabelText('Type *'));
    fireEvent.click(screen.getByText('Auditorium'));
    fireEvent.change(screen.getByLabelText('Capacity *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Opening Time *'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Closing Time *'), { target: { value: '17:00' } });

    fireEvent.click(screen.getByText('Add Facility'));

    await waitFor(() => {
      expect(screen.getByText('A facility with this name already exists')).toBeInTheDocument();
    });
  });

  test('validates closing time is after opening time', async () => {
    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    // Fill out the form with invalid times
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test Facility' } });
    fireEvent.change(screen.getByLabelText('Location *'), { target: { value: 'Test Location' } });
    fireEvent.mouseDown(screen.getByLabelText('Type *'));
    fireEvent.click(screen.getByText('Auditorium'));
    fireEvent.change(screen.getByLabelText('Capacity *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Opening Time *'), { target: { value: '17:00' } });
    fireEvent.change(screen.getByLabelText('Closing Time *'), { target: { value: '09:00' } });

    fireEvent.click(screen.getByText('Add Facility'));

    await waitFor(() => {
      expect(screen.getByText('Closing time must be after opening time')).toBeInTheDocument();
    });
  });

  test('disables submit button when conflicts exist', async () => {
    // Mock API to return conflicts
    mockApi.get.mockResolvedValueOnce({ 
      data: { conflicts: { name: true, location: false } } 
    });

    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test Facility' } });

    await waitFor(() => {
      expect(screen.getByText('Add Facility')).toBeDisabled();
    });
  });

  test('shows loading state during submission', async () => {
    // Mock slow API response
    mockApi.post.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ status: 201, data: {} }), 1000)
    );

    render(
      <MemoryRouter>
        <AddFacility />
      </MemoryRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test Facility' } });
    fireEvent.change(screen.getByLabelText('Location *'), { target: { value: 'Test Location' } });
    fireEvent.mouseDown(screen.getByLabelText('Type *'));
    fireEvent.click(screen.getByText('Auditorium'));
    fireEvent.change(screen.getByLabelText('Capacity *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Opening Time *'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Closing Time *'), { target: { value: '17:00' } });

    fireEvent.click(screen.getByText('Add Facility'));

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});