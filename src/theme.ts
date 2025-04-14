import { createTheme, responsiveFontSizes } from "@mui/material/styles"
import type { PaletteMode } from "@mui/material"

// Create a theme instance for each mode
export const getTheme = (mode: PaletteMode) => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#2563eb" : "#3b82f6", // Blue
        light: mode === "light" ? "#60a5fa" : "#93c5fd",
        dark: mode === "light" ? "#1d4ed8" : "#2563eb",
        contrastText: "#ffffff",
      },
      secondary: {
        main: mode === "light" ? "#8b5cf6" : "#a78bfa", // Purple
        light: mode === "light" ? "#a78bfa" : "#c4b5fd",
        dark: mode === "light" ? "#7c3aed" : "#8b5cf6",
        contrastText: "#ffffff",
      },
      background: {
        default: mode === "light" ? "#f8fafc" : "#0f172a",
        paper: mode === "light" ? "#ffffff" : "#1e293b",
      },
      text: {
        primary: mode === "light" ? "#1e293b" : "#f8fafc",
        secondary: mode === "light" ? "#64748b" : "#94a3b8",
      },
      error: {
        main: "#ef4444",
      },
      warning: {
        main: "#f59e0b",
      },
      info: {
        main: "#0ea5e9",
      },
      success: {
        main: "#10b981",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: "2.5rem",
        fontWeight: 700,
      },
      h2: {
        fontSize: "2rem",
        fontWeight: 700,
      },
      h3: {
        fontSize: "1.75rem",
        fontWeight: 600,
      },
      h4: {
        fontSize: "1.5rem",
        fontWeight: 600,
      },
      h5: {
        fontSize: "1.25rem",
        fontWeight: 600,
      },
      h6: {
        fontSize: "1rem",
        fontWeight: 600,
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 8,
            padding: "8px 16px",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          },
          contained: {
            "&:hover": {
              boxShadow: "none",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow:
              mode === "light"
                ? "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)"
                : "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === "light"
                ? "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)"
                : "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === "light" ? "#ffffff" : "#1e293b",
            borderRight: mode === "light" ? "1px solid #e2e8f0" : "1px solid #334155",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "4px 8px",
            "&.Mui-selected": {
              backgroundColor: mode === "light" ? "rgba(37, 99, 235, 0.1)" : "rgba(59, 130, 246, 0.2)",
              "&:hover": {
                backgroundColor: mode === "light" ? "rgba(37, 99, 235, 0.15)" : "rgba(59, 130, 246, 0.25)",
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
    },
  })

  // Make typography responsive
  theme = responsiveFontSizes(theme)

  return theme
}
