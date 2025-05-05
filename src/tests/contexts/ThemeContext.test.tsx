import { render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { ReactNode } from "react";

// Mock component to test `useTheme` inside `ThemeProvider`
const MockComponent = () => {
  const { mode, toggleTheme } = useTheme();
  return (
    <div>
      <p data-testid="theme-mode">{mode}</p>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle Theme</button>
    </div>
  );
};

describe("ThemeProvider", () => {
  test("provides default theme mode as light", () => {
    render(
      <ThemeProvider>
        <MockComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-mode")).toHaveTextContent("light");
  });

  test("toggles theme mode", () => {
    render(
      <ThemeProvider>
        <MockComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId("toggle-theme");
    
    // Click to switch to dark mode
    toggleButton.click();
    expect(screen.getByTestId("theme-mode")).toHaveTextContent("dark");

    // Click again to switch back to light mode
    toggleButton.click();
    expect(screen.getByTestId("theme-mode")).toHaveTextContent("light");
  });

  test("throws error when useTheme is used outside of ThemeProvider", () => {
    const errorMessage = "useTheme must be used within a ThemeProvider";

    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress React errors in test output

    expect(() => render(<MockComponent />)).toThrow(errorMessage);
    
    console.error.mockRestore();
  });
});
