"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Typography, Box, Paper, Container, Divider } from "@mui/material"
import { Google as GoogleIcon } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import logo from "@/assets/logo.svg"

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth()
  const { mode } = useTheme()
  const navigate = useNavigate()
mode;
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, navigate])

  return (
    
    <Container component="main" maxWidth="xs" sx={{ mt: { xs: 4, md: 8 }, mb: 4 }}>
  <Paper
    elevation={3}
    sx={{
      p: 4,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      borderRadius: 3,
      position: "relative",
    }}
  >
    <Box
      sx={{
      width: "100%",
      maxWidth: 280,
      mb: 0,
      px: 2,
      cursor: "pointer",
      }}
      onClick={() => navigate("/")}
    >
      <img
      src={logo}
      alt="iReserve Logo"
      style={{
        width: "100%",
        height: "auto",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
      }}
      />
    </Box>

    <Typography
      variant="h6"
      component="h1"
      sx={{
      mb: 4,
      fontWeight: 600,
      letterSpacing: 0.5,
      color: "text.primary",
      textAlign: "center",
      lineHeight: 1.3,
      }}
    >
      Facility Management System
    </Typography>

    <Box sx={{ 
      width: "100%", 
      textAlign: "center", 
      mt: 2 
    }}>
      <Button
        variant="contained"
        startIcon={<GoogleIcon />}
        onClick={login}
        fullWidth
        size="large"
        sx={{
          py: 1.5,
          borderRadius: 2,
          textTransform: "none",
          fontSize: "1rem",
          fontWeight: 500,
          boxShadow: 2,
          "&:hover": {
            boxShadow: 3,
            bgcolor: "primary.dark",
          },
        }}
      >
        Continue with Google
      </Button>

      <Divider sx={{ 
        my: 4,
        "&::before, &::after": {
          borderColor: "divider"
        }
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
          OR
        </Typography>
      </Divider>

      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          mb: 2,
          lineHeight: 1.6,
          "& strong": {
            fontWeight: 500,
            color: "text.primary"
          }
        }}
      >
        Don't have an account? <strong>Contact your facility administrator</strong>
      </Typography>
    </Box>
  </Paper>
</Container>
  )
}

export default LoginPage
