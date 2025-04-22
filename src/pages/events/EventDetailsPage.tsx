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
} from "@mui/icons-material"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

interface Organizer {
  staff_id: number
  employee_id: string
  position: string
  name?: string
}

interface EventRegistration {
  status: string
  payment_status: string
  registration_date?: string
}

interface Event {
  event_id: number
  title: string
  description: string
  facility: {
    facility_id: number
    name: string
    location: string
  }
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
  image_url: string
  max_attendees: number
  current_attendees: number
  is_registered: boolean
  organizer?: Organizer | string
  attendees?: Array<{
    id: number
    name: string
    picture?: string
  }>
  registration?: EventRegistration
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
  const [showAttendees, setShowAttendees] = useState(false)

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // First get event details
      const eventResponse = await api.get(`/events/${id}`);
      let isRegistered = false;
  
      // Check registration status for logged-in users
      if (user) {
        try {
          const regResponse = await api.get(`/events/${id}/registration-status`);
          isRegistered = regResponse.data.data.registered;
        } catch (err) {
          console.error("Registration check failed:", err);
          // Don't treat 403 as error - just assume not registered
          if (err.response?.status !== 403) {
            setError("Failed to check registration status");
          }
        }
      }
  
      setEvent({
        ...eventResponse.data.data,
        is_registered: isRegistered
      });
    } catch (err) {
      console.error("Error fetching event details:", err);
      setError("Failed to load event details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEventDetails()
  }, [id, user?.id])

  const handleCancelEvent = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/events/${id}/cancel`);
      await fetchEventDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel the event. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setActionLoading(true)
      const response = await api.post(`/events/${id}/register`)
      
      if (response.data.message?.includes("Already registered")) {
        // Refresh status if already registered
        await fetchEventDetails()
        return
      }

      // Successful registration
      await fetchEventDetails()
      setConfirmDialogOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelRegistration = async () => {
    try {
      setActionLoading(true)
      await api.delete(`/events/${id}/register`)
      await fetchEventDetails()
      setCancelDialogOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel registration. Please try again.")
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

  const renderOrganizer = () => {
    if (!event?.organizer) return "Community Staff"
    if (typeof event.organizer === 'string') return event.organizer
    return event.organizer.name 
      ? `${event.organizer.name} (${event.organizer.position})`
      : `Staff #${event.organizer.employee_id}`
  }

  const renderRegistrationButton = () => {
    if (!event) return null

    switch (event.status.toLowerCase()) {
      case "upcoming":
        if (event.is_registered) {
          return (
            <>
              <Alert 
                icon={<CheckCircleIcon fontSize="inherit" />} 
                severity="success" 
                sx={{ mb: 3 }}
              >
                You are registered for this event!
                {event.registration?.payment_status === 'pending' && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Payment status: Pending
                  </Typography>
                )}
              </Alert>
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
            </>
          )
        }

        if (event.current_attendees >= event.max_attendees) {
          return (
            <Alert severity="error" sx={{ mb: 3 }}>
              This event is fully booked.
            </Alert>
          )
        }

        return (
          <>
            <Button
              variant="contained"
              startIcon={<PersonIcon />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={actionLoading || user?.type !== 'resident'}
              fullWidth
            >
              {actionLoading ? <CircularProgress size={24} /> : 
               user?.type === 'resident' ? "Register for Event" : "Sign in as resident to register"}
            </Button>
          </>
        )

      case "ongoing":
        return (
          <Alert severity="warning" sx={{ mb: 3 }}>
            This event is currently ongoing. Registration is closed.
          </Alert>
        )

      case "completed":
        return (
          <Alert severity="info" sx={{ mb: 3 }}>
            This event has already taken place.
          </Alert>
        )

      case "cancelled":
        return (
          <Alert severity="error" sx={{ mb: 3 }}>
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

  const attendancePercentage = (event.current_attendees / event.max_attendees) * 100
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
                  {event.start_time} - {event.end_time}
                </Typography>
              </Box>

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

              {isStaff && event.attendees && event.attendees.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">Attendees</Typography>
                    <Button onClick={() => setShowAttendees(!showAttendees)}>
                      {showAttendees ? "Hide Attendees" : "Show Attendees"}
                    </Button>
                  </Box>

                  {showAttendees && (
                    <Paper sx={{ maxHeight: 300, overflow: "auto", p: 2 }}>
                      <List>
                        {event.attendees.map((attendee) => (
                          <ListItem key={attendee.id}>
                            <ListItemAvatar>
                              <Avatar src={attendee.picture} alt={attendee.name}>
                                {attendee.name.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={attendee.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration
              </Typography>

              {renderRegistrationButton()}

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
    </section>
  )
}

export default EventDetailsPage