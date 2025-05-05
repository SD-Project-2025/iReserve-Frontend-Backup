import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RecentActivityList from "@/components/dashboard/RecentActivityList"; // Update the import path

describe("RecentActivityList", () => {
  const mockActivities: Activity[] = [
    {
      rawData: {},
      id: 1,
      title: "Task Completed",
      subtitle: "Project X",
      date: "2023-05-15",
      status: "Done",
      statusColor: "success",
    },
    {
      rawData: {},
      id: 2,
      title: "New Comment",
      date: "2023-05-14",
      status: "Pending",
      statusColor: "warning",
    },
  ];

  const mockRenderActions = (activity: Activity) => (
    <button>Action for {activity.title}</button>
  );

  test("renders the component with title", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={[]}
        emptyMessage="No activities"
        loading={false}
      />
    );
    expect(screen.getByText("Recent Activities")).toBeInTheDocument();
  });

  test("shows loading state", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={[]}
        emptyMessage="No activities"
        loading={true}
      />
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("shows empty message when no activities", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={[]}
        emptyMessage="No activities found"
        loading={false}
      />
    );
    expect(screen.getByText("No activities found")).toBeInTheDocument();
  });

  test("renders activities list correctly", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={mockActivities}
        emptyMessage="No activities"
        loading={false}
      />
    );

    expect(screen.getByText("Task Completed")).toBeInTheDocument();
    expect(screen.getByText("Project X")).toBeInTheDocument();
    expect(screen.getByText("2023-05-15")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("New Comment")).toBeInTheDocument();
    expect(screen.getByText("2023-05-14")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  test("renders status chip with correct color", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={mockActivities}
        emptyMessage="No activities"
        loading={false}
      />
    );

    const doneChip = screen.getByText("Done");
    expect(doneChip).toHaveClass("MuiChip-colorSuccess");

    const pendingChip = screen.getByText("Pending");
    expect(pendingChip).toHaveClass("MuiChip-colorWarning");
  });

  test("renders dividers between activities", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={mockActivities}
        emptyMessage="No activities"
        loading={false}
      />
    );

    const dividers = screen.getAllByRole("separator");
    expect(dividers).toHaveLength(mockActivities.length - 1);
  });

  test("renders custom actions when provided", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={mockActivities}
        emptyMessage="No activities"
        loading={false}
        renderActions={mockRenderActions}
      />
    );

    expect(
      screen.getByText("Action for Task Completed")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Action for New Comment")
    ).toBeInTheDocument();
  });

  test("renders View All button when viewAllLink is provided", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={mockActivities}
        emptyMessage="No activities"
        loading={false}
        viewAllLink="/all-activities"
      />
    );

    const viewAllButton = screen.getByText("View All");
    expect(viewAllButton).toBeInTheDocument();
    expect(viewAllButton.closest("a")).toHaveAttribute(
      "href",
      "/all-activities"
    );
  });

  test("renders View All button when viewAllAction is provided", () => {
    const mockViewAllAction = jest.fn();
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={mockActivities}
        emptyMessage="No activities"
        loading={false}
        viewAllAction={mockViewAllAction}
      />
    );

    const viewAllButton = screen.getByText("View All");
    expect(viewAllButton).toBeInTheDocument();
    fireEvent.click(viewAllButton);
    expect(mockViewAllAction).toHaveBeenCalled();
  });

  test("does not render View All button when neither viewAllLink nor viewAllAction is provided", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={mockActivities}
        emptyMessage="No activities"
        loading={false}
      />
    );

    expect(screen.queryByText("View All")).not.toBeInTheDocument();
  });

  test("handles activities without subtitle", () => {
    render(
      <RecentActivityList
        title="Recent Activities"
        activities={[mockActivities[1]]} // Second activity has no subtitle
        emptyMessage="No activities"
        loading={false}
      />
    );

    expect(screen.getByText("New Comment")).toBeInTheDocument();
    expect(screen.queryByText("Project X")).not.toBeInTheDocument();
  });

  test("handles activities without status", () => {
    const activityWithoutStatus = {
      rawData: {},
      id: 3,
      title: "No Status Activity",
      date: "2023-05-13",
    };

    render(
      <RecentActivityList
        title="Recent Activities"
        activities={[activityWithoutStatus]}
        emptyMessage="No activities"
        loading={false}
      />
    );

    expect(screen.getByText("No Status Activity")).toBeInTheDocument();
    expect(screen.queryByTestId("status-chip")).not.toBeInTheDocument();
  });
});