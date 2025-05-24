import { render, screen, fireEvent, act } from "@testing-library/react"
import ProfilePage from "../../../pages/profile/ProfilePage"
//@ts-ignore
import { useNavigate } from "react-router-dom"
//@ts-ignore
import React from "react"

// Mock useAuth hook
jest.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      name: "Jane Doe",
      email: "jane@example.com",
      type: "resident",
      picture: "https://example.com/avatar.jpg",
    },
    logout: jest.fn(),
  }),
}))

jest.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    mode: "light",
    toggleTheme: jest.fn(),
  }),
}))

jest.mock("../../../services/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}))

describe("ProfilePage Component", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

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
    expect(phoneField).not.toBeDisabled()
    expect(addressField).not.toBeDisabled()
  })

  test("name and email fields are disabled", () => {
    renderProfilePage()
    expect(screen.getByLabelText(/Name/i)).toBeDisabled()
    expect(screen.getByLabelText(/Email/i)).toBeDisabled()
  })

  test("shows success message after form submission", async () => {
    renderProfilePage()

    fireEvent.change(screen.getByLabelText(/Phone Number/i), { 
      target: { value: "123-456-7890" }
    })

    const submitButton = screen.getByRole("button", { name: /Save Changes/i })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(await screen.findByText(/Profile updated successfully/i)).toBeInTheDocument()
    expect(submitButton).not.toBeDisabled()
  })

  test("shows error message if update fails", async () => {
    // Mock console.error to prevent test noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Force the simulated API call to reject
    jest.mock("../../../services/api", () => ({
      api: {
        post: jest.fn().mockRejectedValue(new Error("API Error")),
      },
    }))

    renderProfilePage()

    const submitButton = screen.getByRole("button", { name: /Save Changes/i })
    fireEvent.click(submitButton)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(await screen.findByText(/Failed to update profile/i)).toBeInTheDocument()
    consoleErrorSpy.mockRestore()
  })

  test("calls logout function when Logout button is clicked", () => {
    const logoutMock = jest.fn()
    jest.mock("../../../contexts/AuthContext", () => ({
      useAuth: () => ({
        user: {
          name: "Jane Doe",
          email: "jane@example.com",
          type: "resident",
          picture: "",
        },
        logout: logoutMock,
      }),
    }))

    renderProfilePage()
    fireEvent.click(screen.getByRole("button", { name: /Logout/i }))
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })
})