"use client"

import { Box, Typography, Button } from "@mui/material"
import { useNavigate } from "react-router-dom"

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 200px)",
        textAlign: "center",
        p: 3,
      }}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" paragraph>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")} sx={{ mt: 2 }}>
        Go to Dashboard
      </Button>
    </Box>
  )
}

export default NotFoundPage
