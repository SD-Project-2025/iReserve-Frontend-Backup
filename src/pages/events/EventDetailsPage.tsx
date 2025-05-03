"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
} from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { AxiosError } from "axios"
import LocationMap from "@/services/Map"

interface Organizer {
  staff_id: number
  employee_id: string
  position: string
  name?: string
}

interface Facility {
  facility_id: number
  name: string
  type: string
  location: string
  capacity: number
}

interface Event {
  event_id: number
  title: string
  description: string
  facility: Facility
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
  image_url: string
  capacity: number
  registrations: number
  is_public: boolean
  registration_deadline?: string
  fee?: number
  organizer?: Organizer
  is_registered?: boolean
  current_attendees?: number
  max_attendees?: number
  facilityLoc: {
    facility_id: number
    name: string
    location: string
  }
}

const EventDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Get user profile
      const userProfileResponse = await api.get("/auth/me");
      const userProfile = userProfileResponse.data;
      const residentID = userProfile?.data?.profile?.resident_id;
  
      // Fetch event details
      const eventResponse = await api.get(`/events/${id}`);
      const eventData = eventResponse.data.data;
  
      // Default registration status
      let registrationStatus = {
        isRegistered: false,
        status: 'not_registered',
        paymentStatus: null,
        notes: null,
        registrationDate: null
      };
  
      // Only check registration status if user is resident and has residentID
      if (user?.type === 'resident' && residentID) {
        try {
          const statusResponse = await api.get(`/events/${id}/status/${residentID}`);
          if (statusResponse.data?.data) {
            registrationStatus = {
              isRegistered: statusResponse.data.data.status !== 'cancelled',
              status: statusResponse.data.data.status,
              paymentStatus: statusResponse.data.data.paymentStatus,
              notes: statusResponse.data.data.notes,
              registrationDate: statusResponse.data.data.registrationDate
            };
          }
        } catch (err) {
          const axiosError = err as AxiosError;
          // Only log if it's not a 404 error
          if (axiosError.response?.status !== 404) {
            console.error("Failed to check registration status:", err);
            setError("Failed to check registration status");
          }
        }
      }

      const location = eventData.facilityloc?.location || "Unknown Location";
      setEvent({
        ...eventData,
        is_registered: registrationStatus.isRegistered,
        current_attendees: eventData.registrations,
        max_attendees: eventData.capacity,
        registrationStatus, // include full status object if needed
        facilityLoc: {
          ...eventData.facilityloc,
          location: location.trim() ? location : "Unknown Location"
        }
      });
    } catch (err) {
      setError("Failed to load event details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEventDetails()
  }, [id, user?.id])

  const handleRegister = async () => {
    try {
      setActionLoading(true)
      const response = await api.post(`/events/${id}/register`)

      if (response.data.message?.includes("Already registered")) {
        await fetchEventDetails()
        return
      }

      await fetchEventDetails()
      setConfirmDialogOpen(false)
      setSuccess("Successfully registered for the event!")
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setSuccess(null)
      setError(err.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelRegistration = async () => {
    try {
      setActionLoading(true)
      await api.put(`/events/${id}/cancel-registration`)
      await fetchEventDetails()
      setCancelDialogOpen(false)
      setSuccess("Registration cancelled successfully!")
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setSuccess(null)
      const errorMessage = err.response?.data?.message || "Failed to cancel registration. Please try again."
      setError(errorMessage)

      if (errorMessage.includes("not registered") || errorMessage.includes("already cancelled")) {
        setCancelDialogOpen(false)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelEvent = async () => {
    try {
      setActionLoading(true)
      await api.delete(`/events/${id}`)
      await fetchEventDetails()
      setSuccess("Event cancelled successfully!")
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel the event. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "upcoming": return "success"
      case "ongoing": return "warning"
      case "completed": return "default"
      case "cancelled": return "error"
      default: return "default"
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start.toDateString() === end.toDateString()
      ? start.toLocaleDateString()
      : `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
  }

  const renderOrganizer = () => {
    if (!event?.organizer) return "Community Staff"
    return `Staff #${event.organizer.employee_id} (${event.organizer.position})`
  }

  const renderUserStatus = () => {
    if (!user) {
      return (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          Please sign in to view your registration status
        </Alert>
      )
    }

    if (user.type === 'staff') {
      return (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          Staff members cannot register for events
        </Alert>
      )
    }

    if (event?.is_registered) {
      return (
        <Alert 
          icon={<CheckCircleIcon fontSize="inherit" />} 
          severity="success"
          sx={{ mb: 2 }}
        >
          You are registered for this event
        </Alert>
      )
    } else {
      return (
        <Alert 
          icon={<WarningIcon fontSize="inherit" />} 
          severity="info"
          sx={{ mb: 2 }}
        >
          You are not registered for this event
        </Alert>
      )
    }
  }

  const renderRegistrationButtons = () => {
    if (!event) return null

    // If user is staff, don't show registration buttons
    if (user?.type === 'staff') {
      return null
    }

    // If no user is logged in
    if (!user) {
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login')}
          fullWidth
          sx={{ mb: 2 }}
        >
          Sign in to register
        </Button>
      )
    }

    switch (event.status.toLowerCase()) {
      case "upcoming":
        if ((event.current_attendees ?? 0) >= (event.max_attendees ?? 0)) {
          return (
            <Alert severity="error" icon={<WarningIcon />}>
              This event is fully booked.
            </Alert>
          )
        }

        return (
          <Stack spacing={2}>
            {!event.is_registered ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={actionLoading}
                fullWidth
              >
                {actionLoading ? <CircularProgress size={24} /> : "Register for Event"}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
                disabled={actionLoading}
                fullWidth
              >
                {actionLoading ? <CircularProgress size={24} /> : "Cancel Registration"}
              </Button>
            )}
          </Stack>
        )

      case "ongoing":
        return (
          <Alert severity="warning" icon={<WarningIcon />}>
            This event is currently ongoing. Registration is closed.
          </Alert>
        )

      case "completed":
        return (
          <Alert severity="info" icon={<InfoIcon />}>
            This event has already taken place.
          </Alert>
        )

      case "cancelled":
        return (
          <Alert severity="error" icon={<WarningIcon />}>
            This event has been cancelled.
          </Alert>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    )
  }

  if (!event) {
    return <Alert severity="info">Event not found.</Alert>
  }

  const attendancePercentage = ((event.current_attendees ?? 0) / (event.max_attendees ?? 1)) * 100
  const isStaff = user?.type === "staff"

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          {event.title}
        </Typography>
        <Chip
          label={event.status}
          color={getStatusColor(event.status) as any}
          sx={{ fontSize: "1rem", py: 1, px: 2 }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box
            component="img"
            src={event.image_url || `/placeholder.svg?height=400&width=800&text=${encodeURIComponent(event.title)}`}
            alt={event.title}
            sx={{
              width: "100%",
              height: 400,
              objectFit: "cover",
              borderRadius: 2,
              mb: 3,
            }}
          />

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About this event
              </Typography>
              <Typography paragraph>{event.description}</Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Event Details
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {event.facility?.name} • {event.facility?.location}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CalendarIcon color="action" sx={{ mr: 1 }} />
                <Typography>{formatDateRange(event.start_date, event.end_date)}</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TimeIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {formatTimeRange(event.start_time, event.end_time)}
                </Typography>
              </Box>

              {event.registration_deadline && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CalendarIcon color="action" sx={{ mr: 1 }} />
                  <Typography>
                    Registration deadline: {new Date(event.registration_deadline).toLocaleDateString()}
                  </Typography>
                </Box>
              )}

              {event.fee && event.fee > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography color="text.secondary">
                    Fee: ${event.fee.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PersonIcon color="action" sx={{ mr: 1 }} />
                <Typography>Organized by: {renderOrganizer()}</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <GroupIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {event.current_attendees} / {event.max_attendees} attendees
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Registration progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={attendancePercentage}
                  color={attendancePercentage >= 100 ? "error" : "primary"}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {event.current_attendees} registered
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {event.max_attendees} maximum
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Box sx={{ display: "flex", alignItems: "center", mb:2 }}>
                                   
                                   <LocationMap Facility={event.facilityLoc} />
         
                                 </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration
              </Typography>

              {renderUserStatus()}
              {renderRegistrationButtons()}

              <Divider sx={{ my: 3 }} />

              <Button
                variant="outlined"
                onClick={() => navigate(`/facilities/${event.facility?.facility_id}`)}
                fullWidth
                sx={{ mb: 2 }}
              >
                View Facility
              </Button>

              <Button variant="outlined" onClick={() => navigate("/events")} fullWidth>
                Back to Events
              </Button>
            </CardContent>
          </Card>

          {isStaff && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Staff Actions
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/admin/events/${event.event_id}/edit`)}
                  >
                    Edit Event
                  </Button>

                  {event.status === "upcoming" && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        if (window.confirm("Are you sure you want to cancel this event?")) {
                          handleCancelEvent()
                        }
                      }}
                      disabled={actionLoading}
                    >
                      Cancel Event
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Registration Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to register for "{event.title}"? You can cancel your registration later if needed.
          </DialogContentText>
          {event.fee && event.fee > 0 && (
            <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
              Note: This event has a fee of ${event.fee.toFixed(2)} that will need to be paid.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleRegister} color="primary" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : "Register"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Registration Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your registration for "{event.title}"?
          </DialogContentText>
          {event.fee && event.fee > 0 && (
            <DialogContentText sx={{ mt: 2, color: 'warning.main' }}>
              Note: Cancelling may affect any fees you've already paid.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
            Keep Registration
          </Button>
          <Button onClick={handleCancelRegistration} color="error" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : "Cancel Registration"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </section>
  )
}

export default EventDetailsPage