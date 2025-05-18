
import { render, screen } from "@testing-library/react";
import ViewUser from "../../../components/admin/ViewUser";
//@ts-ignore
import React from "react"
// Mock API since we don’t want real calls during tests
jest.mock("@/services/api");

describe("ViewUser Component", () => {
  test("renders loading state", () => {
    render(<ViewUser />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});