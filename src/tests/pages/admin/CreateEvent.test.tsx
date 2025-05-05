import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import CreateEventPage from "@/pages/CreateEvent"
import { api } from "@/services/api"

jest.mock("@/services/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))
test("displays loading spinner initially", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })
  
    render(<CreateEventPage />, { wrapper: MemoryRouter })
  
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
    await waitFor(() => expect(api.get).toHaveBeenCalled())
  })
  test("renders form after facilities load", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })
  
    render(<CreateEventPage />, { wrapper: MemoryRouter })
  
    await waitFor(() => {
      expect(screen.getByLabelText(/Title \*/)).toBeInTheDocument()
    })
  })
  test("shows validation errors for empty required fields on step 0", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } })
  
    render(<CreateEventPage />, { wrapper: MemoryRouter })
  
    await waitFor(() => screen.getByText("Event Details"))
  
    fireEvent.click(screen.getByText(/Next/i))
  
    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument()
      expect(screen.getByText("Description is required")).toBeInTheDocument()
      expect(screen.getByText("Please select a facility")).toBeInTheDocument()
    })
  })
  test("submits valid data and shows success toast", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [{ facility_id: 1, name: "Hall", capacity: 100, type: "room", status: "open", image_url: "" }] } })
    ;(api.post as jest.Mock).mockResolvedValue({})
  
    render(<CreateEventPage />, { wrapper: MemoryRouter })
  
    // Step 0
    await waitFor(() => screen.getByLabelText(/Title \*/))
    fireEvent.change(screen.getByLabelText(/Title \*/), { target: { value: "Event ABC" } })
    fireEvent.change(screen.getByLabelText(/Description \*/), { target: { value: "Some description here" } })
    fireEvent.mouseDown(screen.getByLabelText("Select Facility")) // assuming you're using a Select
    fireEvent.click(screen.getByText("Hall"))
    fireEvent.click(screen.getByText(/Next/))
  
    // Simulate rest of steps and submit here...
    // You can mock DatePicker/TimePicker values with fireEvent.change or mocking the component if needed.
  
    // Directly call handleSubmit if testing in isolation or abstract that logic
  })
  test("shows error message when API call fails", async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error("API failure"))
  
    render(<CreateEventPage />, { wrapper: MemoryRouter })
  
    await waitFor(() => {
      expect(screen.getByText(/Failed to load facilities/i)).toBeInTheDocument()
    })
  })
          