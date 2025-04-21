"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Typography, Box, Paper, Container, Avatar, Divider } from "@mui/material"
import { Google as GoogleIcon } from "@mui/icons-material"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

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
    <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 3,
        }}
      >
        <Avatar onClick={() => navigate("/")}
          sx={{
            width: 60,
            height: 60,
            bgcolor: "primary.main",
            mb: 2,
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          IR
        </Avatar>
        <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
          IReserve
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
           Sports Facility Management
        </Typography>

        <Box component="section" sx={{ width: "100%", textAlign: "center", mt: 3 }}>
          <Typography component="h2" variant="h5" gutterBottom fontWeight="medium">
          
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
           
          </Typography>

          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={login}
            fullWidth
            size="large"
            sx={{
              mt: 2,
              py: 1.5,
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            Sign in/Sign up with Google
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Don't have an account? Contact your facility administrator.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default LoginPage
