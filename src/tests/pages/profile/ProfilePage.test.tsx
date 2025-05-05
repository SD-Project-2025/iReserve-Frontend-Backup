import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/pages/profile/ProfilePage";
import { useAuth } from "@/contexts/AuthContext";
import { vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("ProfilePage Component", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    picture: "profile.jpg",
    type: "user",
  };
  
  const mockLogout = vi.fn();

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser, logout: mockLogout });
  });

  test("renders profile page correctly", () => {
    render(<ProfilePage />);

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("user Account")).toBeInTheDocument();
  });

  test("logs out when logout button is clicked", () => {
    render(<ProfilePage />);
    
    fireEvent.click(screen.getByText("Logout"));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test("submits profile form successfully", async () => {
    render(<ProfilePage />);

    fireEvent.change(screen.getByLabelText("Phone Number"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Address"), { target: { value: "123 Main St" } });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
    });
  });

  test("handles error during profile update", async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText("Failed to update profile. Please try again later.")).toBeInTheDocument();
    });
  });
});
