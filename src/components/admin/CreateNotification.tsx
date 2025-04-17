"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Avatar,
  Paper,
  Switch,
  Grid,
} from "@mui/material"
import {
  Send as SendIcon,
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Notifications as AppNotificationIcon,
} from "@mui/icons-material"

interface ReceiverData {
  user_id: number
  name: string
  email: string
  notificationPrefs: string
    
    
  
}

const CreateNotification = () => {
  const navigate = useNavigate()
  //const receiverData = useLocation().state.userData as ReceiverData
  // Mock receiver data - replace with your actual mock data
  const receiverData: ReceiverData = {
    user_id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    notificationPrefs: "both",
      
   
    
  }

  const [notification, setNotification] = useState({
    title: "",
    message: "",
    method: receiverData.notificationPrefs,
    isUrgent: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (field: string, value: string | boolean) => {
    setNotification(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSuccess(`Notification sent successfully via ${notification.method === "both" ? "email and in-app" : notification.method}`)
      setNotification({ title: "", message: "", method: "both", isUrgent: false })
    } catch (err) {
      setError("Failed to send notification. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
        variant="outlined"
      >
        Back
      </Button>

      <Typography variant="h4" component="h1" gutterBottom sx={{ color: "primary.main" }}>
        Send Notification
      </Typography>

      <Card elevation={3} sx={{ mb: 3, borderLeft: "4px solid", borderColor: "primary.main" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: "primary.light" }}>
              {receiverData.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{receiverData.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {receiverData.email}
              </Typography>
              <Chip
                label={`Prefers ${receiverData.notificationPrefs} notifications`}
                size="small"
                sx={{ 
                  mt: 1,
                  backgroundColor: 
                    receiverData.notificationPrefs === "both" ? "info.light" :
                    receiverData.notificationPrefs === "email" ? "warning.light" :
                    "success.light"
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notification Title"
                  value={notification.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                  InputProps={{
                    sx: { backgroundColor: "background.paper" }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  value={notification.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  required
                  InputProps={{
                    sx: { backgroundColor: "background.paper" }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, backgroundColor: "grey.50" }}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                      Delivery Method
                    </FormLabel>
                    <RadioGroup
                      value={notification.method}
                      onChange={(e) => handleChange("method", e.target.value)}
                      sx={{ gap: 1 }}
                    >
                      <FormControlLabel
                        value="email"
                        control={<Radio color="warning" />}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <EmailIcon sx={{ mr: 1, color: "warning.main" }} />
                            Email Only
                          </Box>
                        }
                        disabled={!["email", "both"].includes(receiverData.notificationPrefs)}
                      />
                      <FormControlLabel
                        value="inApp"
                        control={<Radio color="success" />}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <AppNotificationIcon sx={{ mr: 1, color: "success.main" }} />
                            In-App Only
                          </Box>
                        }
                        disabled={!["inApp", "both"].includes(receiverData.notificationPrefs)}
                      />
                      <FormControlLabel
                        value="both"
                        control={<Radio color="info" />}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <EmailIcon sx={{ mr: 1, color: "info.main" }} />
                            <AppNotificationIcon sx={{ mr: 1, color: "info.main" }} />
                            Both Channels
                          </Box>
                        }
                        disabled={receiverData.notificationPrefs !== "both"}
                      />
                    </RadioGroup>
                  </FormControl>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notification.isUrgent}
                      onChange={(e) => handleChange("isUrgent", e.target.checked)}
                      color="error"
                    />
                  }
                  label={
                    <Typography sx={{ color: notification.isUrgent ? "error.main" : "inherit" }}>
                      Mark as Urgent
                    </Typography>
                  }
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 3 }}>
                {success}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={loading}
                sx={{
                  px: 4,
                  bgcolor: notification.isUrgent ? "error.main" : "primary.main",
                  "&:hover": {
                    bgcolor: notification.isUrgent ? "error.dark" : "primary.dark",
                  }
                }}
              >
                Send Notification
                {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CreateNotification