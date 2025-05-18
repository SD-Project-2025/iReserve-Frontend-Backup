"use client"
//@ts-ignore
import React from "react"
import { render, act } from "@testing-library/react"
import { ThemeProvider, useTheme } from "../../contexts/ThemeContext"
import { fireEvent } from "@testing-library/react"

describe("ThemeProvider & useTheme", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  test("provides default theme mode as 'light'", () => {
    const TestComponent = () => {
      const { mode } = useTheme()
      return <div data-testid="mode">{mode}</div>
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(getByTestId("mode")).toHaveTextContent("light")
  })

  test("loads theme mode from localStorage if available", () => {
    localStorage.setItem("themeMode", "dark")

    const TestComponent = () => {
      const { mode } = useTheme()
      return <div data-testid="mode">{mode}</div>
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(getByTestId("mode")).toHaveTextContent("dark")
  })

  test("toggles theme mode and updates localStorage", () => {
    const TestComponent = () => {
      const { mode, toggleTheme } = useTheme()
      return (
        <>
          <div data-testid="mode">{mode}</div>
          <button onClick={toggleTheme} data-testid="toggle-btn">
            Toggle
          </button>
        </>
      )
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Initial mode should be light
    expect(getByTestId("mode")).toHaveTextContent("light")

    // Toggle once
    act(() => {
      fireEvent.click(getByTestId("toggle-btn"))
    })
    expect(getByTestId("mode")).toHaveTextContent("dark")
    expect(localStorage.setItem).toHaveBeenCalledWith("themeMode", "dark")

    // Toggle again
    act(() => {
      fireEvent.click(getByTestId("toggle-btn"))
    })
    expect(getByTestId("mode")).toHaveTextContent("light")
    expect(localStorage.setItem).toHaveBeenCalledWith("themeMode", "light")
  })

  test("throws error when useTheme is used outside ThemeProvider", () => {
    const TestComponent = () => {
      try {
        useTheme()
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>
      }
      return null
    }

    const { getByTestId } = render(<TestComponent />)
    expect(getByTestId("error")).toHaveTextContent(
      "useTheme must be used within a ThemeProvider"
    )
  })
})