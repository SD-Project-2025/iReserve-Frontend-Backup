"use client"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, Typography, Alert, Button } from "@mui/material"
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer"
import { useAuth } from "@/contexts/AuthContext"

const AuthCallbackPage = () => {
  const { setAuthData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(location.search)
        const token = params.get("token")
        const userId = params.get("user_id")
        const userType = params.get("user_type")
        const name = params.get("name")
        const email = params.get("email")
        const picture = params.get("picture")

        if (!token || !userId || !userType) {
          const errorMsg = params.get("error")
          setError(decodeURIComponent(errorMsg || "Authentication failed. Missing required parameters."))
          setLoading(false)
          return
        }

        setAuthData(token, {
          id: Number.parseInt(userId),
          type: userType,
          name: name || undefined,
          email: email || undefined,
          picture: picture || undefined,
        })

        
        setTimeout(() => {
          navigate("/dashboard")
        }, 3000)
      } catch (err) {
        console.error("Error during authentication callback:", err)
        setError("An unexpected error occurred during authentication.")
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [location.search, setAuthData, navigate])

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
        px: 3,
      }}
    >
      {error ? (
        <>
          <Alert severity="error" sx={{ mb: 3, maxWidth: 480 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Typography variant="body2">
              Please try again or contact support if the issue persists.
            </Typography>
          </Alert>
          <Button variant="contained" onClick={() => window.location.href = "/"} size="large">
            Go Back to Login
          </Button>
        </>
      ) : loading ? (
        <>
          <Box
            sx={{
              animation: "spin 1.5s linear infinite",
              mb: 4,
              color: "primary.main",
            }}
          >
            <SportsSoccerIcon sx={{ fontSize: 80 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: "medium" }}>
            Completing authentication...
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            This won't take long.
          </Typography>

          {/* Spinner animation */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </>
      ) : null}
    </Box>
  )
}

export default AuthCallbackPage
