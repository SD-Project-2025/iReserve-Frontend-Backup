
import { render, screen, fireEvent } from "@testing-library/react"
import ProfilePage from "@/pages/profile/ProfilePage"
//@ts-ignore
import { useNavigate } from "react-router-dom"
//@ts-ignore
import React from "react"
// Mock useAuth hook
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      name: "Jane Doe",
      email: "jane@example.com",
      type: "resident",
      picture: "https://example.com/avatar.jpg ",
    },
    logout: jest.fn(),
  }),
}))
jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    mode: "light",
    toggleTheme: jest.fn(),
  }),
}))
jest.mock("@/services/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}))


describe("ProfilePage Component", () => {
  const renderProfilePage = () => {
    return render(<ProfilePage />)
  }

  test("renders user profile info correctly", () => {
    renderProfilePage()

    expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
    expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument()
    expect(screen.getByText(/jane@example\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/Resident Account/i)).toBeInTheDocument()
  })

  test("displays enabled phone and address fields", () => {
    renderProfilePage()

    const phoneField = screen.getByLabelText(/Phone Number/i)
    const addressField = screen.getByLabelText(/Address/i)

    expect(phoneField).toBeInTheDocument()
    expect(addressField).toBeInTheDocument()

    // These should be enabled
    expect(phoneField).not.toBeDisabled()
    expect(addressField).not.toBeDisabled()
  })

  test("name and email fields are disabled", () => {
    renderProfilePage()

    const nameField = screen.getByLabelText(/Name/i)
    const emailField = screen.getByLabelText(/Email/i)

    expect(nameField).toBeDisabled()
    expect(emailField).toBeDisabled()
  })

  test("shows success message after form submission", async () => {
    renderProfilePage()

    const phoneInput = screen.getByLabelText(/Phone Number/i)
    fireEvent.change(phoneInput, { target: { value: "123-456-7890" } })

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }))

    // Confirm loading state
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeDisabled()

    // Wait for success message (simulated delay in component)
    await new Promise((r) => setTimeout(r, 1100))
    expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument()
  })

  test("shows error message if update fails", async () => {
    // Mock failed form submit by overriding handleSubmit
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    const originalFormData = global.FormData
    
    // Replace native form data temporarily to simulate failure
    global.FormData = class {
      get() {
        return "Mock Data"
      }
    } as any

    renderProfilePage()

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }))

    await new Promise((r) => setTimeout(r, 1100))
    expect(screen.getByText(/Failed to update profile/i)).toBeInTheDocument()

    // Restore original implementation
    global.FormData = originalFormData
    consoleErrorSpy.mockRestore()
  })

  test("calls logout function when Logout button is clicked", () => {
    const logoutMock = jest.fn()
    jest.mocked(require("@/contexts/AuthContext").useAuth).mockReturnValue({
      user: {
        name: "Jane Doe",
        email: "jane@example.com",
        type: "resident",
        picture: "",
      },
      logout: logoutMock,
    })

    renderProfilePage()

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }))
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })
})