"use client"

import type React from "react"
import { useState } from "react"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
} from "@mui/material"
import { useAuth } from "@/contexts/AuthContext"
import {
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from "@mui/icons-material"

const ProfilePage = () => {
  const { user, logout } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
  })
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    method: "both", // "inApp", "email", or "both"
    marketingEmails: true,
    pushNotifications: true,
    soundEnabled: true,
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNotificationChange = (field: string, value: any) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // In a real app, you would update both profile and notification prefs
      // await Promise.all([
      //   api.put("/users/profile", formData),
      //   api.put("/users/notifications", notificationPrefs)
      // ])

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess("Settings updated successfully!")
    } catch (err) {
      console.error("Error updating settings:", err)
      setError("Failed to update settings. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Avatar src={user?.picture} alt={user?.name || "User"} sx={{ width: 120, height: 120, mb: 2 }} />
              <Typography variant="h6">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                {user?.type} Account
              </Typography>
              <Button variant="outlined" color="error" onClick={logout} sx={{ mt: 3 }}>
                Logout
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      disabled
                      helperText="Name cannot be changed (managed by Google)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      disabled
                      helperText="Email cannot be changed (managed by Google)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* Notification Preferences Section */}
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend">Notification Method</FormLabel>
                  <RadioGroup
                    row
                    value={notificationPrefs.method}
                    onChange={(e) => handleNotificationChange("method", e.target.value)}
                  >
                    <FormControlLabel
                      value="inApp"
                      control={<Radio />}
                      label="In-App Only"
                    />
                    <FormControlLabel
                      value="email"
                      control={<Radio />}
                      label="Email Only"
                    />
                    <FormControlLabel
                      value="both"
                      control={<Radio />}
                      label="Both"
                    />
                  </RadioGroup>
                </FormControl>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationPrefs.marketingEmails}
                        onChange={(e) => handleNotificationChange("marketingEmails", e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <EmailIcon sx={{ mr: 1 }} />
                        Receive marketing emails
                      </Box>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationPrefs.pushNotifications}
                        onChange={(e) => handleNotificationChange("pushNotifications", e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {notificationPrefs.pushNotifications ? (
                          <NotificationsIcon sx={{ mr: 1 }} />
                        ) : (
                          <NotificationsOffIcon sx={{ mr: 1 }} />
                        )}
                        Push notifications
                      </Box>
                    }
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationPrefs.soundEnabled}
                        onChange={(e) => handleNotificationChange("soundEnabled", e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Notification sounds"
                    disabled={!notificationPrefs.pushNotifications}
                  />
                </Box>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                  <Button type="submit" variant="contained" disabled={loading}>
                    Save Changes
                    {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
                  </Button>
                </Box>
              </form>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your account is managed through Google. For security settings, please visit your Google account
                settings.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </section>
  )
}

export default ProfilePage