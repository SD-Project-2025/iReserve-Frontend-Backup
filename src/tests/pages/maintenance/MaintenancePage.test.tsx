
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import MaintenancePage from "@/pages/maintenance/MaintenancePage"
import { api } from "@/services/api"
 
// Mock the API module
jest.mock("@/services/api", () => ({
  api: {
    get: jest.fn(),
  },
}))

// Mock useNavigate
const mockedNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}))

const mockReports = [
  {
    report_id: 1,
    title: "Leaking Pipe",
    description: "There's a leaking pipe in the bathroom that needs fixing.",
    facility: { name: "Bathroom", facility_id: 101 },
    reported_date: "2024-04-01T00:00:00.000Z",
    status: "reported",
    priority: "high",
  },
  {
    report_id: 2,
    title: "Broken Light",
    description: "Ceiling light in the study room is broken.",
    facility: { name: "Study Room", facility_id: 102 },
    reported_date: "2024-04-02T00:00:00.000Z",
    status: "completed",
    priority: "low",
  },
]

describe("MaintenancePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders loading spinner initially", async () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<MaintenancePage />, { wrapper: MemoryRouter })
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("displays error message on fetch failure", async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error("API error"))

    render(<MaintenancePage />, { wrapper: MemoryRouter })

    await waitFor(() =>
      expect(screen.getByText(/failed to load maintenance reports/i)).toBeInTheDocument()
    )
  })

  it("displays fetched maintenance reports", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockReports } })

    render(<MaintenancePage />, { wrapper: MemoryRouter })

    await waitFor(() => {
      expect(screen.getByText("Leaking Pipe")).toBeInTheDocument()
      expect(screen.getByText("Broken Light")).toBeInTheDocument()
    })
  })

  it("filters reports by tab", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockReports } })

    render(<MaintenancePage />, { wrapper: MemoryRouter })

    await waitFor(() => expect(screen.getByText("Leaking Pipe")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("tab", { name: "Completed" }))

    expect(screen.queryByText("Leaking Pipe")).not.toBeInTheDocument()
    expect(screen.getByText("Broken Light")).toBeInTheDocument()
  })

  it("navigates to create report page when 'Report Issue' button is clicked", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

    render(<MaintenancePage />, { wrapper: MemoryRouter })

    await waitFor(() => screen.getByRole("button", { name: /report issue/i }))

    fireEvent.click(screen.getByRole("button", { name: /report issue/i }))

    expect(mockedNavigate).toHaveBeenCalledWith("/maintenance/create")
  })

  it("shows empty state message when there are no reports", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

    render(<MaintenancePage />, { wrapper: MemoryRouter })

    await waitFor(() => {
      expect(screen.getByText(/no maintenance reports found/i)).toBeInTheDocument()
    })
  })

  it("navigates to report detail page when clicking a report title", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: mockReports } })

    render(<MaintenancePage />, { wrapper: MemoryRouter })

    await waitFor(() => screen.getByText("Leaking Pipe"))
    fireEvent.click(screen.getByText("Leaking Pipe"))

    expect(mockedNavigate).toHaveBeenCalledWith("/maintenance/1")
  })
})
