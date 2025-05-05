
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import LoginPage from "@/pages/auth/LoginPage"

// Mock the contexts
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    login: jest.fn(),
  }),
}))

jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    mode: "light",
  }),
}))

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe("LoginPage", () => {
  it("renders the login page content", () => {
    renderWithRouter(<LoginPage />)

    expect(screen.getByText("IReserve")).toBeInTheDocument()
    expect(screen.getByText("Sports Facility Management")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in \/ sign up with google/i })).toBeInTheDocument()
  })

  it("triggers the login function when button is clicked", () => {
    const mockLogin = jest.fn()

    jest.mock("@/contexts/AuthContext", () => ({
      useAuth: () => ({
        isAuthenticated: false,
        login: mockLogin,
      }),
    }))

    renderWithRouter(<LoginPage />)

    const loginButton = screen.getByRole("button", { name: /sign in \/ sign up with google/i })
    fireEvent.click(loginButton)

    expect(mockLogin).toHaveBeenCalled()
  })

  it("shows message about contacting admin", () => {
    renderWithRouter(<LoginPage />)
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
  })
})
