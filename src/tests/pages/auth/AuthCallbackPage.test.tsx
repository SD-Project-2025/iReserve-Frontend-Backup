import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter,useLocation } from "react-router-dom";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";
import { useAuth } from "@/contexts/AuthContext";
import { vi } from "vitest";


vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: () => ({
      search: "?token=mockToken&user_id=1&user_type=user&name=John&email=john@example.com&picture=profile.jpg",
    }),
  };
});

describe("AuthCallbackPage Component", () => {
  test("renders loading state initially", () => {
    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Completing authentication...")).toBeInTheDocument();
  });

  test("sets authentication data and redirects", async () => {
    const mockSetAuthData = vi.fn();
    (useAuth as jest.Mock).mockReturnValue({ setAuthData: mockSetAuthData });

    const mockNavigate = vi.fn();
    vi.mocked(mockNavigate);

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSetAuthData).toHaveBeenCalledWith("mockToken", {
        id: 1,
        type: "user",
        name: "John",
        email: "john@example.com",
        picture: "profile.jpg",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("shows error when authentication fails", async () => {
    vi.mocked(useLocation).mockReturnValue({
      search: "?error=Authentication%20failed",
    });

    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Authentication failed")).toBeInTheDocument();
      expect(screen.getByText("Please try again or contact support if the issue persists.")).toBeInTheDocument();
    });
  });
});
