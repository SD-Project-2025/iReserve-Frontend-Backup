import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import ViewUser from "@/components/admin/ViewUser";
import { api } from "@/services/api";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

// Mock API and hooks
jest.mock("@/services/api");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ id: "1" }),
  useLocation: () => ({
    state: null
  })
}));

const mockStaffUser = {
  user_id: 1,
  name: "John Doe",
  email: "john@example.com",
  type: "staff",
  status: "active",
  created_at: "2023-01-01",
  is_admin: false,
  last_login: "2023-01-02",
  employee_id: "EMP123",
  position: "Manager",
  department: "Operations"
};

const mockResidentUser = {
  user_id: 2,
  name: "Jane Smith",
  email: "jane@example.com",
  type: "resident",
  status: "inactive",
  created_at: "2023-01-02",
  encrypted_address: "123 Main St",
  membership_type: "Premium"
};

const mockAssignments = [
  {
    assignment_id: 1,
    facility_id: 1,
    name: "Main Gym",
    type: "Fitness",
    location: "Building A",
    assigned_date: "2023-01-01",
    open_time: "08:00",
    close_time: "22:00"
  }
];

const mockFacilities = [
  {
    facility_id: 1,
    name: "Main Gym",
    type: "Fitness",
    location: "Building A",
    capacity: 100,
    status: "active"
  }
];

describe("ViewUser Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockReset();
    (api.put as jest.Mock).mockReset();
    (api.post as jest.Mock).mockReset();
    (api.delete as jest.Mock).mockReset();
  });

  test("renders staff details with assignments", async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockStaffUser })
      .mockResolvedValueOnce({ data: { data: mockAssignments } });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("EMP123")).toBeInTheDocument();
      expect(screen.getByText("Manager")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /make admin/i })).toBeInTheDocument();
      expect(screen.getByText("Main Gym")).toBeInTheDocument();
    });
  });

  test("handles admin privilege toggle", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockStaffUser });
    (api.put as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(async () => {
      fireEvent.click(screen.getByText(/make admin/i));
      fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
      
      expect(api.put).toHaveBeenCalledWith(
        "/manage/users/1/admin",
        { is_admin: true }
      );
    });
  });

  test("handles resident downgrade", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockStaffUser });
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(async () => {
      fireEvent.click(screen.getByText(/downgrade to resident/i));
      fireEvent.click(screen.getByRole("button", { name: /downgrade/i }));
      
      expect(api.post).toHaveBeenCalledWith(
        "/manage/users/1/downgrade",
        undefined
      );
    });
  });

  test("shows resident details", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockResidentUser });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByText(/upgrade to staff/i)).toBeInTheDocument();
    });
  });

  test("handles facility assignment removal", async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockStaffUser })
      .mockResolvedValueOnce({ data: { data: mockAssignments } });
    (api.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
      expect(api.delete).toHaveBeenCalledWith(
        "/manage/users/staff/unassign?userId=1&facilityId=1"
      );
    });
  });

  test("validates employee ID format during upgrade", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockResidentUser });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(async () => {
      fireEvent.click(screen.getByText(/upgrade to staff/i));
      const input = screen.getByLabelText(/employee id/i);
      
      // Test non-numeric input
      await userEvent.type(input, "abc");
      expect(input).toHaveValue("");
      
      // Test valid input
      await userEvent.type(input, "123");
      fireEvent.click(screen.getByText(/upgrade/i));
      
      expect(api.post).toHaveBeenCalledWith(
        "/manage/users/2/upgrade",
        { employee_id: "EMP123" }
      );
    });
  });

  test("handles assignment creation flow", async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockStaffUser })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: mockFacilities } });
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(async () => {
      fireEvent.click(screen.getByText(/add assignment/i));
      
      const facilitySelect = await screen.findByRole("combobox");
      fireEvent.mouseDown(facilitySelect);
      
      const listbox = await screen.findByRole("listbox");
      const option = within(listbox).getByText(/main gym/i);
      fireEvent.click(option);
      
      fireEvent.click(screen.getByRole("button", { name: /assign/i }));
      
      expect(api.post).toHaveBeenCalledWith(
        "/manage/users/staff/assign",
        { userId: "1", facilityId: 1 }
      );
    });
  });

  test("shows error when no user data", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: null });

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no user data available/i)).toBeInTheDocument();
    });
  });

  test("handles assignment loading error", async () => {
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockStaffUser })
      .mockRejectedValueOnce(new Error("Assignment error"));

    render(
      <MemoryRouter>
        <ViewUser />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load assignments/i)).toBeInTheDocument();
    });
  });
});