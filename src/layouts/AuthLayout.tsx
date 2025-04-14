"use client"

import { Outlet } from "react-router-dom"
import { Container, Typography, Box, IconButton, useTheme as useMuiTheme } from "@mui/material"
import { LightMode, DarkMode } from "@mui/icons-material"
import { useTheme } from "@/contexts/ThemeContext"

const AuthLayout = () => {
  const { mode, toggleTheme } = useTheme()
  const muiTheme = useMuiTheme()

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: muiTheme.palette.background.default,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          p: 2,
        }}
      >
        <IconButton onClick={toggleTheme} color="inherit">
          {mode === "light" ? <DarkMode /> : <LightMode />}
        </IconButton>
      </Box>

      <Container
        component="main"
        maxWidth="xs"
        sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        <Outlet />
      </Container>

      <Box component="footer" sx={{ textAlign: "center", py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Ireserve. All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}

export default AuthLayout
