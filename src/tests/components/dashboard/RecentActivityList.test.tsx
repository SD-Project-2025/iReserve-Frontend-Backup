import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import RecentActivityList from  "../../../components/dashboard/RecentActivityList"
import { Button } from "@mui/material"
// Mock react-router-dom Link to avoid errors
jest.mock("react-router-dom", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

interface Activity {
  rawData: any
  id: number
  title: string
  subtitle?: string
  date: string
  status?: string
  statusColor?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
}

const mockActivities: Activity[] = [
  {
    id: 1,
    rawData: {},
    title: "User signed up",
    subtitle: "john@example.com",
    date: "2 minutes ago",
    status: "Success",
    statusColor: "success",
  },
  {
    id: 2,
    rawData: {},
    title: "Payment failed",
    subtitle: "payment#1001",
    date: "5 hours ago",
    status: "Failed",
    statusColor: "error",
  },
]

describe("RecentActivityList Component", () => {
  const defaultProps = {
    title: "Recent Activity",
    activities: mockActivities,
    emptyMessage: "No recent activity found.",
    loading: false,
  }

  test("renders title correctly", () => {
    render(<RecentActivityList {...defaultProps} />)
    expect(screen.getByText("Recent Activity")).toBeInTheDocument()
  })

  test("shows loading spinner when loading is true", () => {
    render(<RecentActivityList {...defaultProps} loading={true} />)
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  test("displays empty message when activities array is empty", () => {
    render(<RecentActivityList {...defaultProps} activities={[]} />)
    expect(screen.getByText("No recent activity found.")).toBeInTheDocument()
  })

  test("renders all activity items with title, subtitle, date, and status", () => {
    render(<RecentActivityList {...defaultProps} />)
    
    // Titles
    expect(screen.getByText("User signed up")).toBeInTheDocument()
    expect(screen.getByText("Payment failed")).toBeInTheDocument()

    // Subtitles
    expect(screen.getByText("john@example.com")).toBeInTheDocument()
    expect(screen.getByText("payment#1001")).toBeInTheDocument()

    // Dates
    expect(screen.getByText("2 minutes ago")).toBeInTheDocument()
    expect(screen.getByText("5 hours ago")).toBeInTheDocument()

    // Statuses
    expect(screen.getByText("Success")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()

    // Check status chip colors
    const successChip = screen.getByText("Success").closest(".MuiChip-root")
    const errorChip = screen.getByText("Failed").closest(".MuiChip-root")

    expect(successChip).toHaveClass("MuiChip-colorSuccess")
    expect(errorChip).toHaveClass("MuiChip-colorError")
  })

  test("renders 'View All' button with Link when viewAllLink is provided", () => {
    render(<RecentActivityList {...defaultProps} viewAllLink="/activities" />)
    const viewAllButton = screen.getByRole("link", { name: /view all/i })
    expect(viewAllButton).toBeInTheDocument()
    expect(viewAllButton).toHaveAttribute("href", "/activities")
  })

  test("renders 'View All' button with onClick when viewAllAction is provided", () => {
    const handleClick = jest.fn()
    render(<RecentActivityList {...defaultProps} viewAllAction={handleClick} />)
    
    const viewAllButton = screen.getByRole("button", { name: /view all/i })
    fireEvent.click(viewAllButton)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test("renders custom actions per activity when renderActions is provided", () => {
    const renderActionsMock = () => (
      <Button size="small">Details</Button>
    )

    render(
      <RecentActivityList
        {...defaultProps}
        renderActions={renderActionsMock}
      />
    )

    expect(screen.getAllByText("Details")).toHaveLength(mockActivities.length)
  })
})