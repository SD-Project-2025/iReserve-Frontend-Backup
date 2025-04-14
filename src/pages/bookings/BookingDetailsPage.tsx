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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"

interface Booking {
  booking_id: number
  facility: {
    facility_id: number
    name: string
    location: string
  }
  date: string
  start_time: string
  end_time: string
  status: string
  purpose: string
  attendees: number
  notes: string
  created_at: string
}

const BookingDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get(`/bookings/${id}`)
        setBooking(response.data.data)
      } catch (err) {
        console.error("Error fetching booking details:", err)
        setError("Failed to load booking details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBookingDetails()
    }
  }, [id])

  const handleCancelBooking = async () => {
    try {
      setCancelling(true)
      await api.put(`/bookings/${id}/cancel`)
      // Refresh booking details
      const response = await api.get(`/bookings/${id}`)
      setBooking(response.data.data)
      setCancelDialogOpen(false)
    } catch (err) {
      console.error("Error cancelling booking:", err)
      setError("Failed to cancel booking. Please try again later.")
    } finally {
      setCancelling(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  if (!booking) {
    return <Alert severity="info">Booking not found.</Alert>
  }

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Booking Details
        </Typography>
        <Chip
          label={booking.status}
          color={getStatusColor(booking.status) as any}
          sx={{ fontSize: "1rem", py: 1, px: 2 }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {booking.purpose}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {booking.facility?.name} • {booking.facility?.location}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CalendarIcon color="action" sx={{ mr: 1 }} />
                <Typography>{new Date(booking.date).toLocaleDateString()}</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TimeIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {booking.start_time} - {booking.end_time}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <GroupIcon color="action" sx={{ mr: 1 }} />
                <Typography>{booking.attendees} attendees</Typography>
              </Box>

              {booking.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                    <DescriptionIcon color="action" sx={{ mr: 1, mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Additional Notes
                      </Typography>
                      <Typography>{booking.notes}</Typography>
                    </Box>
                  </Box>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary">
                Booking created on {new Date(booking.created_at).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/facilities/${booking.facility?.facility_id}`)}
                  fullWidth
                >
                  View Facility
                </Button>

                {(booking.status === "approved" || booking.status === "pending") && (
                  <Button variant="outlined" color="error" onClick={() => setCancelDialogOpen(true)} fullWidth>
                    Cancel Booking
                  </Button>
                )}

                <Button variant="outlined" onClick={() => navigate("/bookings")} fullWidth>
                  Back to Bookings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
            No, Keep Booking
          </Button>
          <Button onClick={handleCancelBooking} color="error" disabled={cancelling}>
            Yes, Cancel Booking
            {cancelling && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default BookingDetailsPage
