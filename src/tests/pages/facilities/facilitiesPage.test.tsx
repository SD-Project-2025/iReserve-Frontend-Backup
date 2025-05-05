// FacilitiesPage.test.tsx

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import FacilitiesPage from "@/pages/facilities/FacilitiesPage"
import { api } from "@/services/api"

// Mock the API
jest.mock("@/services/api", () => ({
  api: {
    get: jest.fn(),
  },
}))

const mockFacilities = [
  {
    facility_id: 1,
    name: "Basketball Court",
    type: "Sports",
    location: "Block A",
    capacity: 50,
    is_indoor: true,
    image_url: "",
    status: "open",
    description: "Indoor basketball court",
  },
  {
    facility_id: 2,
    name: "Swimming Pool",
    type: "Recreation",
    location: "Block B",
    capacity: 30,
    is_indoor: false,
    image_url: "",
    status: "maintenance",
    description: "Outdoor pool",
  },
]

// Helper to render with router
const renderWithRouter = (ui: React.ReactNode) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe("FacilitiesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders loading state", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockFacilities } })
    ;(api.get as jest.Mock).mockResolvedValue({ data: { data: [] } }) // mock ratings

    renderWithRouter(<FacilitiesPage />)

    expect(screen.getByRole("progressbar")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument())
  })

  it("renders facilities", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockFacilities } })
    ;(api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

    renderWithRouter(<FacilitiesPage />)

    await waitFor(() => {
      expect(screen.getByText("Basketball Court")).toBeInTheDocument()
      expect(screen.getByText("Swimming Pool")).toBeInTheDocument()
    })
  })

  it("filters by search", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockFacilities } })
    ;(api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

    renderWithRouter(<FacilitiesPage />)

    await waitFor(() => screen.getByText("Basketball Court"))

    fireEvent.change(screen.getByLabelText(/search facilities/i), {
      target: { value: "Basketball" },
    })

    expect(screen.getByText("Basketball Court")).toBeInTheDocument()
    expect(screen.queryByText("Swimming Pool")).not.toBeInTheDocument()
  })

  it("filters by type", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockFacilities } })
    ;(api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

    renderWithRouter(<FacilitiesPage />)

    await waitFor(() => screen.getByText("Basketball Court"))

    fireEvent.mouseDown(screen.getByLabelText(/type/i))
    fireEvent.click(screen.getByText("Recreation"))

    expect(screen.queryByText("Basketball Court")).not.toBeInTheDocument()
    expect(screen.getByText("Swimming Pool")).toBeInTheDocument()
  })

  it("handles API error", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("Failed to load"))

    renderWithRouter(<FacilitiesPage />)

    await waitFor(() =>
      expect(screen.getByText(/failed to load facilities/i)).toBeInTheDocument()
    )
  })

  it("shows message when no facilities match", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockFacilities } })
    ;(api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })

    renderWithRouter(<FacilitiesPage />)

    await waitFor(() => screen.getByText("Basketball Court"))

    fireEvent.change(screen.getByLabelText(/search facilities/i), {
      target: { value: "Nonexistent Facility" },
    })

    expect(screen.getByText(/no facilities found/i)).toBeInTheDocument()
  })
})
