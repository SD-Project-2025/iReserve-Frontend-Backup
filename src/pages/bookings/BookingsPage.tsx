"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Add as AddIcon, Visibility as VisibilityIcon, Cancel as CancelIcon } from "@mui/icons-material"
import { api } from "@/services/api"

interface Booking {
  booking_id: number
  facility_id: number
  resident_id: number
  date: string
  start_time: string
  end_time: string
  status: string
  purpose: string
  attendees: number
  Facility: {
    name: string
    type: string
    location: string
    facility_id: number
  }
}

const BookingsPage = () => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/bookings/my-bookings")
        setBookings(response.data.data)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError("Failed to load bookings. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`)
      const response = await api.get("/bookings/my-bookings")
      setBookings(response.data.data)
    } catch (err) {
      console.error("Error cancelling booking:", err)
      setError("Failed to cancel booking. Please try again later.")
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

  const filteredBookings = bookings.filter((booking) => {
    if (tabValue === 0) return true
    if (tabValue === 1) return booking.status === "approved"
    if (tabValue === 2) return booking.status === "pending"
    if (tabValue === 3) return booking.status === "rejected" || booking.status === "cancelled"
    return true
  })

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Bookings
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/bookings/create")}>
          New Booking
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="booking tabs">
            <Tab label="All" id="tab-0" />
            <Tab label="Approved" id="tab-1" />
            <Tab label="Pending" id="tab-2" />
            <Tab label="Rejected/Cancelled" id="tab-3" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredBookings.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Facility</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
  {filteredBookings.map((booking) => {
    console.log("Booking:", booking); // Log to verify Facility presence

    const facilityName =
      booking.Facility && booking.Facility.name
        ? booking.Facility.name
        : "Unknown Facility";

    return (
      <TableRow key={booking.booking_id}>
        <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
        <TableCell>
          {booking.start_time} - {booking.end_time}
        </TableCell>
        <TableCell>
          <Typography color={facilityName === "Unknown Facility" ? "error" : "textPrimary"}>
            {facilityName}
          </Typography>
        </TableCell>
        <TableCell>{booking.purpose}</TableCell>
        <TableCell>
          <Chip
            label={booking.status}
            color={getStatusColor(booking.status) as any}
            size="small"
          />
        </TableCell>
        <TableCell>
          <IconButton
            color="primary"
            onClick={() => navigate(`/bookings/${booking.booking_id}`)}
            size="small"
          >
            <VisibilityIcon />
          </IconButton>
          {(booking.status === "approved" || booking.status === "pending") && (
            <IconButton
              color="error"
              onClick={() => handleCancelBooking(booking.booking_id)}
              size="small"
            >
              <CancelIcon />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    );
  })}
</TableBody>

              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No bookings found</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate("/bookings/create")}
                sx={{ mt: 2 }}
              >
                Create a Booking
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default BookingsPage
