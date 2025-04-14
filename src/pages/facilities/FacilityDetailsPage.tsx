"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import {
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  Info as InfoIcon,
  Event as EventIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

interface Facility {
  facility_id: number
  name: string
  type: string
  location: string
  capacity: number
  is_indoor: boolean
  image_url: string
  status: string
  description: string
  open_time: string
  close_time: string
}

interface Booking {
  booking_id: number
  date: string
  start_time: string
  end_time: string
  status: string
}

interface Event {
  event_id: number
  title: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
}

const FacilityDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [facility, setFacility] = useState<Facility | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  useEffect(() => {
    const fetchFacilityDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const facilityResponse = await api.get(`/facilities/${id}`)
        setFacility(facilityResponse.data.data)

        // Fetch upcoming bookings for this facility
        const bookingsResponse = await api.get(`/facilities/${id}/bookings`)
        setBookings(bookingsResponse.data.data || [])

        // Fetch upcoming events for this facility
        const eventsResponse = await api.get(`/facilities/${id}/events`)
        setEvents(eventsResponse.data.data || [])
      } catch (err) {
        console.error("Error fetching facility details:", err)
        setError("Failed to load facility details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchFacilityDetails()
    }
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "success"
      case "closed":
        return "error"
      case "maintenance":
        return "warning"
      case "upcoming":
        return "info"
      case "ongoing":
        return "warning"
      case "completed":
        return "default"
      case "approved":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  const handleBookFacility = () => {
    if (facility?.status !== "open") {
      setError("This facility is not available for booking at the moment.")
      return
    }

    if (user?.type === "resident") {
      navigate("/bookings/create", { state: { facilityId: facility?.facility_id } })
    } else {
      setBookingDialogOpen(true)
    }
  }

  const handleReportIssue = () => {
    navigate("/maintenance/create", { state: { facilityId: facility?.facility_id } })
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

  if (!facility) {
    return <Alert severity="info">Facility not found.</Alert>
  }

  return (
    <section>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {facility.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Chip label={facility.status} color={getStatusColor(facility.status) as any} sx={{ mr: 2 }} />
          <Typography variant="subtitle1" color="text.secondary">
            {facility.type} • {facility.is_indoor ? "Indoor" : "Outdoor"}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Box
            component="img"
            src={facility.image_url || "/placeholder.svg?height=400&width=800&text=" + facility.name}
            alt={facility.name}
            sx={{
              width: "100%",
              height: 400,
              objectFit: "cover",
              borderRadius: 2,
              mb: 3,
            }}
          />

          <Typography variant="h5" component="h2" gutterBottom>
            About this facility
          </Typography>
          <Typography paragraph>{facility.description}</Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" component="h2" gutterBottom>
            Upcoming Bookings
          </Typography>

          {bookings.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.booking_id}>
                      <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {booking.start_time} - {booking.end_time}
                      </TableCell>
                      <TableCell>
                        <Chip label={booking.status} size="small" color={getStatusColor(booking.status) as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ mb: 3 }}>No upcoming bookings for this facility.</Typography>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" component="h2" gutterBottom>
            Upcoming Events
          </Typography>

          {events.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.event_id}>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>
                        {new Date(event.start_date).toLocaleDateString()}
                        {event.start_date !== event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
                      </TableCell>
                      <TableCell>
                        {event.start_time} - {event.end_time}
                      </TableCell>
                      <TableCell>
                        <Chip label={event.status} size="small" color={getStatusColor(event.status) as any} />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => navigate(`/events/${event.event_id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No upcoming events for this facility.</Typography>
          )}

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={handleBookFacility}
              disabled={facility.status !== "open"}
            >
              Book this Facility
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => navigate("/events", { state: { facilityFilter: facility.facility_id } })}
            >
              View All Events
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Facility Details
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography>{facility.location}</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TimeIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {facility.open_time} - {facility.close_time}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <GroupIcon color="action" sx={{ mr: 1 }} />
                <Typography>Capacity: {facility.capacity} people</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <InfoIcon color="action" sx={{ mr: 1 }} />
                <Typography>{facility.is_indoor ? "Indoor facility" : "Outdoor facility"}</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Need Help?
              </Typography>
              <Typography paragraph>
                If you have any questions about this facility or need to report an issue, please contact our staff.
              </Typography>
              <Button variant="outlined" fullWidth onClick={handleReportIssue}>
                Report an Issue
              </Button>
            </CardContent>
          </Card>

          {user?.type === "staff" && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Staff Actions
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button variant="outlined" onClick={() => navigate(`/admin/facilities/${facility.facility_id}/edit`)}>
                    Edit Facility
                  </Button>
                  <Button
                    variant="outlined"
                    color={facility.status === "open" ? "error" : "success"}
                    onClick={() => {
                      // In a real app, this would update the facility status
                      alert(`Facility status would be changed to ${facility.status === "open" ? "closed" : "open"}`)
                    }}
                  >
                    {facility.status === "open" ? "Close Facility" : "Open Facility"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Staff booking dialog */}
      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)}>
        <DialogTitle>Staff Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            As a staff member, you can create bookings on behalf of residents. Would you like to:
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setBookingDialogOpen(false)
              navigate("/bookings/create", { state: { facilityId: facility?.facility_id } })
            }}
          >
            Create My Booking
          </Button>
          <Button
            onClick={() => {
              setBookingDialogOpen(false)
              navigate("/admin/bookings/create", { state: { facilityId: facility?.facility_id } })
            }}
          >
            Create for Resident
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default FacilityDetailsPage
