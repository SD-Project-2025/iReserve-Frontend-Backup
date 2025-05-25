// CreateEventPage.test.tsx
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CreateEventPage from '@/pages/admin/CreateEvent'
import { api } from '@/services/api'
import '@testing-library/jest-dom'

// Mock the API module
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

// Mock Cloudinary upload
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ secure_url: 'https://cloudinary.com/image.jpg' }),
  })
) as jest.Mock

// Mock date-pickers and other MUI components
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ value, onChange, minDate }: any) => (
    <input
      data-testid="date-picker"
      value={value?.toISOString() || ''}
      onChange={(e) => onChange(new Date(e.target.value))}
      min={minDate?.toISOString()}
    />
  ),
}))

jest.mock('@mui/x-date-pickers/TimePicker', () => ({
  TimePicker: ({ value, onChange }: any) => (
    <input
      data-testid="time-picker"
      value={value?.toISOString() || ''}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}))

const mockFacilities = [
  {
    facility_id: 1,
    name: 'Community Hall',
    type: 'Hall',
    status: 'open',
    capacity: 100,
    image_url: 'hall.jpg',
  },
]

describe('CreateEventPage', () => {
  beforeEach(() => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockFacilities } })
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  test('renders correctly and shows initial step', async () => {
    render(
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Create Event')).toBeInTheDocument()
      expect(screen.getByText('Event Details')).toBeInTheDocument()
      expect(screen.getByLabelText('Title *')).toBeInTheDocument()
    })
  })

  test('validates step 1 required fields', async () => {
    render(
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)
      
      expect(screen.getByText('Title is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
      expect(screen.getByText('Please select a facility')).toBeInTheDocument()
    })
  })

  test('handles facility selection and capacity update', async () => {
    render(
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    )

    await waitFor(async () => {
      const facilitySelect = screen.getByLabelText('Facility *')
      fireEvent.mouseDown(facilitySelect)
      const option = await screen.findByText('Community Hall (Hall)')
      fireEvent.click(option)
      
      const capacityInput = screen.getByLabelText('Capacity *') as HTMLInputElement
      expect(capacityInput.value).toBe('100')
    })
  })

  test('validates step 2 date and time constraints', async () => {
    render(
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    )

    // Fill step 1
    fireEvent.input(screen.getByLabelText('Title *'), { target: { value: 'Test Event' } })
    fireEvent.input(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } })
    fireEvent.mouseDown(screen.getByLabelText('Facility *'))
    fireEvent.click(await screen.findByText('Community Hall (Hall)'))
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    // Try invalid dates
    await waitFor(() => {
      const startDateInput = screen.getAllByTestId('date-picker')[0]
      fireEvent.change(startDateInput, { target: { value: new Date().toISOString() } })
      fireEvent.click(nextButton)
      
      expect(screen.getByText('Start date must be at least 2 days from today')).toBeInTheDocument()
    })
  })

  test('handles image upload process', async () => {
    render(
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    )

    // Advance to step 3
    fireEvent.input(screen.getByLabelText('Title *'), { target: { value: 'Test Event' } })
    fireEvent.input(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } })
    fireEvent.mouseDown(screen.getByLabelText('Facility *'))
    fireEvent.click(await screen.findByText('Community Hall (Hall)'))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    
    // Step 2
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 2)
    fireEvent.change(screen.getAllByTestId('date-picker')[0], { target: { value: startDate.toISOString() } })
    fireEvent.change(screen.getAllByTestId('date-picker')[1], { target: { value: startDate.toISOString() } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    
    // Step 3
    await waitFor(async () => {
      // Upload image
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const input = screen.getByLabelText(/select image/i) as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })
      
      // Upload button
      fireEvent.click(screen.getByRole('button', { name: /upload image/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
        expect(fetch).toHaveBeenCalled()
      })
      
      // Wait for upload completion
      await act(async () => {
        await jest.runAllTimers()
      })
      
      expect(screen.getByText('Image uploaded')).toBeInTheDocument()
    })
  })

  test('submits form successfully', async () => {
    (api.post as jest.Mock).mockResolvedValue({})
    render(
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    )

    // Fill all steps
    // Step 1
    fireEvent.input(screen.getByLabelText('Title *'), { target: { value: 'Test Event' } })
    fireEvent.input(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } })
    fireEvent.mouseDown(screen.getByLabelText('Facility *'))
    fireEvent.click(await screen.findByText('Community Hall (Hall)'))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 2
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 2)
    fireEvent.change(screen.getAllByTestId('date-picker')[0], { target: { value: startDate.toISOString() } })
    fireEvent.change(screen.getAllByTestId('date-picker')[1], { target: { value: startDate.toISOString() } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 3
    await waitFor(async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const input = screen.getByLabelText(/select image/i) as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })
      
      fireEvent.click(screen.getByRole('button', { name: /upload image/i }))
      await act(async () => {
        await jest.runAllTimers()
      })
      
      fireEvent.click(screen.getByRole('button', { name: /create event/i }))
      
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/events', expect.any(Object))
        expect(screen.getByText('An event created successfully!')).toBeInTheDocument()
      })
    })
  })

  test('handles API errors', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'))
    render(
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load facilities')).toBeInTheDocument()
    })
  })
})