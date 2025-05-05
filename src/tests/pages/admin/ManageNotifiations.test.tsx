import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageNotifications from "../../components/ManageNotifications";
import { emailservice } from "@/services/emailservice";
import { vi } from "vitest"; // Using Vitest for mocking

vi.mock("@/services/emailservice", () => ({
  emailservice: {
    post: vi.fn(),
  },
}));

describe("ManageNotifications Component", () => {
  test("renders ManageNotifications correctly", () => {
    render(<ManageNotifications />);

    expect(screen.getByText("Manage Notifications")).toBeInTheDocument();
    expect(screen.getByLabelText("Recipient Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(screen.getByText("Send Notification")).toBeInTheDocument();
  });

  test("displays validation error when submitting empty fields", async () => {
    render(<ManageNotifications />);

    const sendButton = screen.getByText("Send Notification");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("Subject and message are required")).toBeInTheDocument();
    });
  });

  test("submits a notification successfully", async () => {
    emailservice.post.mockResolvedValueOnce({
      data: { status: "success", message: "Notification sent successfully!" },
    });

    render(<ManageNotifications />);

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Test Subject" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Test Message" } });

    fireEvent.click(screen.getByText("Send Notification"));

    await waitFor(() => {
      expect(screen.getByText("Notification sent successfully!")).toBeInTheDocument();
    });
  });

  test("handles API errors gracefully", async () => {
    emailservice.post.mockRejectedValueOnce({
      response: { status: 400, data: { message: "Invalid request data" } },
    });

    render(<ManageNotifications />);

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Test Subject" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Test Message" } });

    fireEvent.click(screen.getByText("Send Notification"));

    await waitFor(() => {
      expect(screen.getByText("Invalid request data")).toBeInTheDocument();
    });
  });
});
