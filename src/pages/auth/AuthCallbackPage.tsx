"use client"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Box, CircularProgress, Typography, Alert } from "@mui/material"
import { useAuth } from "@/contexts/AuthContext"

const AuthCallbackPage = () => {
  const { setAuthData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse the URL parameters
        const params = new URLSearchParams(location.search)
        const token = params.get("token")
        const userId = params.get("user_id")
        const userType = params.get("user_type")
        const name = params.get("name")
        const email = params.get("email")
        const picture = params.get("picture")

        // Check if we have the required parameters
        if (!token || !userId || !userType) {
          // Check if there's an error message
          const errorMsg = params.get("error")
          if (errorMsg) {
            setError(decodeURIComponent(errorMsg))
          } else {
            setError("Authentication failed. Missing required parameters.")
          }
          return
        }

        // Set the authentication data
        setAuthData(token, {
          id: Number.parseInt(userId),
          type: userType,
          name: name || undefined,
          email: email || undefined,
          picture: picture || undefined,
        })

        // Redirect to dashboard
        navigate("/dashboard")
      } catch (err) {
        console.error("Error during authentication callback:", err)
        setError("An unexpected error occurred during authentication.")
      }
    }

    handleAuthCallback()
  }, [location.search, setAuthData, navigate])

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 3, width: "100%", maxWidth: 500 }}>
          {error}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Please try again or contact support if the problem persists.</Typography>
          </Box>
        </Alert>
      ) : (
        <>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" component="h2">
            Completing authentication...
          </Typography>
        </>
      )}
    </Box>
  )
}

export default AuthCallbackPage
