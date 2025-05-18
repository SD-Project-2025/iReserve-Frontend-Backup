import React from "react"
import { Button, Typography, Box, Container } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { LockOutlined as LockIcon } from "@mui/icons-material"

const AccessDenied: React.FC = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate("/login") 
  }

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 10 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <LockIcon sx={{ fontSize: 60, color: "error.main" }} />
        <Typography variant="h4" component="h1" gutterBottom color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Your account has been suspended due to policy violations!

        </Typography>
        <Typography variant="body2" color="textSecondary">
            If you believe this is a mistake, please contact support.{" "}
            <a href="mailto:sdproject.wits@gmail.com" style={{ color: "#1976d2", textDecoration: "none" }}>
                sdproject.wits@gmail.com
            </a>
        </Typography>


        <Button
          variant="contained"
          color="primary"
          onClick={handleGoBack}
          sx={{ mt: 3 }}
        >
          Back to Login
        </Button>
      </Box>
    </Container>
  )
}

export default AccessDenied
