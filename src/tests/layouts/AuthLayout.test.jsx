import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthLayout from "@/layouts/AuthLayout";
import React from "react";
import { MemoryRouter } from "react-router-dom";  

test("renders AuthLayout component", () => {
  render(
    <ThemeProvider>
      <AuthLayout />
    </ThemeProvider>
  );

  expect(screen.getByText(/Ireserve. All rights reserved./i)).toBeInTheDocument();
});
