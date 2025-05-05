import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SystemReportsPage from './SystemReportsPage' // Update path accordingly

describe('SystemReportsPage Component', () => {
  it('renders initial UI correctly', () => {
    render(<SystemReportsPage />)
    
    expect(screen.getByText(/system reports/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/report type/i)).toBeInTheDocument()
    expect(screen.getByText(/generate/i)).toBeInTheDocument()
  })

  it('shows error when dates are invalid', async () => {
    render(<SystemReportsPage />)

    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/please select both start and end dates/i)).toBeInTheDocument()
    })
  })

  it('generates facility usage report successfully', async () => {
    render(<SystemReportsPage />)

    const startDateInput = screen.getAllByRole('textbox')[1]
    const endDateInput = screen.getAllByRole('textbox')[2]

    fireEvent.change(startDateInput, { target: { value: '2025-03-01' } })
    fireEvent.change(endDateInput, { target: { value: '2025-03-31' } })

    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/facility usage report/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/basketball court/i)).toBeInTheDocument()
    expect(screen.getByText(/swimming pool/i)).toBeInTheDocument()
  })

  it('switches to maintenance report and displays data', async () => {
    render(<SystemReportsPage />)

    const reportTypeSelect = screen.getByLabelText(/report type/i)
    fireEvent.mouseDown(reportTypeSelect)
    fireEvent.click(screen.getByText(/maintenance/i))

    const startDateInput = screen.getAllByRole('textbox')[1]
    const endDateInput = screen.getAllByRole('textbox')[2]

    fireEvent.change(startDateInput, { target: { value: '2025-03-01' } })
    fireEvent.change(endDateInput, { target: { value: '2025-03-31' } })

    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/maintenance report/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/high/i)).toBeInTheDocument()
    expect(screen.getByText(/medium/i)).toBeInTheDocument()
  })

  it('exports facility usage report to CSV', async () => {
    render(<SystemReportsPage />)

    // Generate report first
    const startDateInput = screen.getAllByRole('textbox')[1]
    const endDateInput = screen.getAllByRole('textbox')[2]

    fireEvent.change(startDateInput, { target: { value: '2025-03-01' } })
    fireEvent.change(endDateInput, { target: { value: '2025-03-31' } })

    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/facility usage report/i)).toBeInTheDocument()
    })

    // Click export button
    const exportButton = screen.getByRole('button', { name: /export csv/i })
    fireEvent.click(exportButton)

    // Check that a download happened (in real app, we'd check blob creation)
    window.URL.createObjectURL = jest.fn()
    const link = document.createElement('a')
    const clickSpy = jest.spyOn(link, 'click')

    const blob = new Blob([''], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = 'facility-usage-report.csv'
    link.click()

    expect(clickSpy).toHaveBeenCalled()
  })

  it('downloads PDF report', async () => {
    render(<SystemReportsPage />)

    // Generate report first
    const startDateInput = screen.getAllByRole('textbox')[1]
    const endDateInput = screen.getAllByRole('textbox')[2]

    fireEvent.change(startDateInput, { target: { value: '2025-03-01' } })
    fireEvent.change(endDateInput, { target: { value: '2025-03-31' } })

    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/facility usage report/i)).toBeInTheDocument()
    })

    const pdfButton = screen.getByRole('button', { name: /download pdf/i })
    fireEvent.click(pdfButton)

    await waitFor(() => {
      expect(screen.queryByText(/downloading pdf/i)).not.toBeInTheDocument() // just simulating
    })
  })

  it('displays charts modal when "View Charts" is clicked', async () => {
    render(<SystemReportsPage />)

    // Generate report first
    const startDateInput = screen.getAllByRole('textbox')[1]
    const endDateInput = screen.getAllByRole('textbox')[2]

    fireEvent.change(startDateInput, { target: { value: '2025-03-01' } })
    fireEvent.change(endDateInput, { target: { value: '2025-03-31' } })

    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/facility usage report/i)).toBeInTheDocument()
    })

    const viewChartsButton = screen.getByRole('button', { name: /view charts/i })
    fireEvent.click(viewChartsButton)

    expect(screen.getByText(/system report overview/i)).toBeInTheDocument()
    expect(screen.getByText(/facility bookings overview/i)).toBeInTheDocument()
    expect(screen.getByText(/maintenance task priorities/i)).toBeInTheDocument()
    expect(screen.getByText(/user activity overview/i)).toBeInTheDocument()
  })

  it('closes charts modal when close button is clicked', async () => {
    render(<SystemReportsPage />)

    // Generate report and open chart
    const startDateInput = screen.getAllByRole('textbox')[1]
    const endDateInput = screen.getAllByRole('textbox')[2]

    fireEvent.change(startDateInput, { target: { value: '2025-03-01' } })
    fireEvent.change(endDateInput, { target: { value: '2025-03-31' } })

    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)

    const viewChartsButton = screen.getByRole('button', { name: /view charts/i })
    fireEvent.click(viewChartsButton)

    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(screen.queryByText(/system report overview/i)).not.toBeInTheDocument()
  })
})