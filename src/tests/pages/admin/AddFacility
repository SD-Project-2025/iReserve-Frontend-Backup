//@ts-ignore
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddFacility from '@/pages/admin/AddFacility';
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { MemoryRouter } from "react-router-dom";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mocks
jest.mock("@mui/material/utils", () => ({
  // Make debounce a no-op so we can test immediately
  debounce: (fn: any) => fn,
  //@ts-ignore
  createSvgIcon: (component: any, name: string) => () => <div>{name}</div>,
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock icons
jest.mock('@mui/icons-material/CloudUpload', () => ({ __esModule: true, default: () => <div>CloudUploadIcon</div> }));
jest.mock('@mui/icons-material/Add', () => ({ __esModule: true, default: () => <div>AddIcon</div> }));
jest.mock('@mui/icons-material/Delete', () => ({ __esModule: true, default: () => <div>DeleteIcon</div> }));
jest.mock('@mui/icons-material/Upload', () => ({ __esModule: true, default: () => <div>UploadIcon</div> }));
jest.mock('@mui/icons-material/Photo', () => ({ __esModule: true, default: () => <div>PhotoIcon</div> }));
jest.mock('@mui/icons-material/Save', () => ({ __esModule: true, default: () => <div>SaveIcon</div> }));
jest.mock('@mui/icons-material/Clear', () => ({ __esModule: true, default: () => <div>ClearIcon</div> }));
jest.mock('@mui/icons-material/AccessTime', () => ({ __esModule: true, default: () => <div>AccessTimeIcon</div> }));
jest.mock('@mui/icons-material/Description', () => ({ __esModule: true, default: () => <div>DescriptionIcon</div> }));
jest.mock('@mui/icons-material/LocationOn', () => ({ __esModule: true, default: () => <div>LocationOnIcon</div> }));
jest.mock('@mui/icons-material/Group', () => ({ __esModule: true, default: () => <div>GroupIcon</div> }));

// Helper to render with required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {ui}
      </LocalizationProvider>
    </MemoryRouter>
  );
};

// Stub environment variables
process.env.VITE_CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/test/upload";
process.env.VITE_CLOUDINARY_UPLOAD_PRESET_FACILITIES = "preset123";

// Helper to build a File of given size in bytes
function makeFile(name: string, size: number, type = "image/png") {
  const blob = new Blob([new ArrayBuffer(size)], { type });
  return new File([blob], name, { type });
}

beforeEach(() => {
  jest.clearAllMocks();
  // By default, user is staff
  (useAuth as jest.Mock).mockReturnValue({ user: { type: "staff" } });
  
  // Mock URL.createObjectURL
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
  
  // Mock fetch for file uploads
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ secure_url: "https://cloudinary.com/test.png" }),
  });
});

describe("AddFacility component", () => {
  test("redirects non-staff users to /unauthorized", () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { type: "customer" } });
    renderWithProviders(<AddFacility />);
    expect(mockNavigate).toHaveBeenCalledWith("/unauthorized");
  });

  test("renders form when staff", () => {
    renderWithProviders(<AddFacility />);
    expect(screen.getByRole("heading", { name: /Add New Facility/i })).toBeInTheDocument();
  });

  describe("validateField utility", () => {
    it("validates open and close times", async () => {
      renderWithProviders(<AddFacility />);
      
      // Use actual time format with AM/PM
      const openInput = screen.getByLabelText(/Opening Time \*/i);
      const closeInput = screen.getByLabelText(/Closing Time \*/i);

      // Test empty validation
      fireEvent.blur(openInput);
      fireEvent.blur(closeInput);
      //@ts-ignore
      expect(screen.getByText((_, node) => node?.textContent?.match(/Opening time is required/i) !== null)).toBeInTheDocument();
      //@ts-ignore
      expect(screen.getByText((_, node) => node?.textContent?.match(/Closing time is required/i) !== null)).toBeInTheDocument();

      // Test time comparison
      await act(async () => {
        await userEvent.type(openInput, "09:00 AM");
        await userEvent.type(closeInput, "08:00 AM");
      });

      await waitFor(() => {
        expect(screen.getByText(/must be after opening time/i)).toBeInTheDocument();
      });
    });

    // it("validates description length", async () => {
    //   renderWithProviders(<AddFacility />);
      
    //   // Use textarea role for description field
    //   const desc = screen.getByRole('textbox', { name: /Description \*/i });
      
    //   fireEvent.blur(desc);
    //   expect(screen.getByText(/Description is required/i)).toBeInTheDocument();

    //   await userEvent.type(desc, "short");
    //   fireEvent.blur(desc);
    //   expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();

    //   await userEvent.type(desc, "a".repeat(500));
    //   fireEvent.blur(desc);
    //   expect(screen.getByText(/too long/i)).toBeInTheDocument();
    // });
  });

  describe("file selection & preview", () => {
    test("selecting a file shows preview and filename", async () => {
      renderWithProviders(<AddFacility />);
      
      // Use proper file input selection
      const input = screen.getByLabelText(/Select Image/i).querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = makeFile("pic.png", 1024);
      await userEvent.upload(input, file);
      
      expect(screen.getByText(/pic.png/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Preview/i)).toBeInTheDocument();
    });
  });

  describe("uploadToCloudinary & handleUploadClick", () => {
    test("warns if no file selected", async () => {
      renderWithProviders(<AddFacility />);
      
      // Use more flexible button query
      const uploadButton = screen.getByRole("button", { name: /Upload Image/i });
      userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Please select an image file first/i)).toBeInTheDocument();
      });
    });
  });

  describe("form submission", () => {
    test("successful submit calls API", async () => {
      (api.post as jest.Mock).mockResolvedValue({ status: 201 });
      renderWithProviders(<AddFacility />);

      // Fill form with proper interactions
      await userEvent.type(screen.getByLabelText(/Name \*/i), "Test Facility");
      await userEvent.type(screen.getByLabelText(/Location \*/i), "Test Location");
      
      // Handle select dropdown
      const typeSelect = screen.getByRole("combobox", { name: /Type \*/i });
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByRole("option", { name: /Gym/i }));

      // Fill other fields
      await userEvent.type(screen.getByLabelText(/Capacity \*/i), "100");
      await userEvent.type(screen.getByLabelText(/Opening Time \*/i), "09:00 AM");
      await userEvent.type(screen.getByLabelText(/Closing Time \*/i), "05:00 PM");
      await userEvent.type(screen.getByRole('textbox', { name: /Description \*/i }), "Valid description that is long enough to pass validation requirements");

      // Upload image
      const input = screen.getByLabelText(/Select Image/i).querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, makeFile("test.jpg", 1024));
      await userEvent.click(screen.getByRole("button", { name: /Upload Image/i }));

      // Submit form
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add Facility/i })).not.toBeDisabled();
      });

      await userEvent.click(screen.getByRole("button", { name: /Add Facility/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });
  });
});