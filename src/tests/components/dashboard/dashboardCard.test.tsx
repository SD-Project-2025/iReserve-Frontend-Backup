import React from "react"
import { render, screen } from "@testing-library/react"
import DashboardCard from "../../../components/dashboard/DashboardCard"
import { Typography } from "@mui/material"
import { ThemeProvider, createTheme } from "@mui/material/styles"

// Wrap component in MUI ThemeProvider to avoid theme-related errors
const renderWithTheme = (component: React.ReactElement) => {
  const theme = createTheme()
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

describe("DashboardCard", () => {
  const defaultProps = {
    title: "Total Users",
    value: 123,
    icon: <span data-testid="icon">ICON</span>,
  }

  test("renders title and value correctly", () => {
    renderWithTheme(<DashboardCard {...defaultProps} />)
    
    expect(screen.getByText("Total Users")).toBeInTheDocument()
    expect(screen.getByText("123")).toBeInTheDocument()
  })

  test("renders icon with default color", () => {
    renderWithTheme(<DashboardCard {...defaultProps} />)
    
    const iconBox = screen.getByTestId("icon").parentElement
    expect(iconBox).toHaveStyle({ color: "primary.main" })
    expect(iconBox).toHaveStyle({ backgroundColor: "rgba(0, 171, 145, 0.15)" }) // primary.main + 15%
  })

  test("applies custom color prop correctly", () => {
    renderWithTheme(
      <DashboardCard {...defaultProps} color="#ff5722" />
    )

    const iconBox = screen.getByTestId("icon").parentElement
    expect(iconBox).toHaveStyle({ color: "#ff5722" })
    expect(iconBox).toHaveStyle({ backgroundColor: "rgba(255, 87, 34, 0.15)" })
  })

  test("displays optional children", () => {
    renderWithTheme(
      <DashboardCard {...defaultProps}>
        <Typography variant="body2">Extra info</Typography>
      </DashboardCard>
    )
    
    expect(screen.getByText("Extra info")).toBeInTheDocument()
  })

  test("applies custom sx styles", () => {
    renderWithTheme(
      <DashboardCard {...defaultProps} sx={{ height: 200, m: 2 }} />
    )

    const card = screen.getByTestId("icon").closest(".MuiCard-root")
    expect(card).toHaveStyle({ height: "200px" })
    expect(card).toHaveStyle({ margin: "16px" }) // m=2 → 8 * 2 = 16px
  })
})