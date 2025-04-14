"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Typography, Grid, Button, Box, Card, CardContent, Alert, ButtonGroup } from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  SportsTennis as SportsIcon,
  Event as EventIcon,
  Build as MaintenanceIcon,
  Notifications as NotificationIcon,
} from "@mui/icons-material"
import { useAuth } from "../../contexts/AuthContext"
import { api } from "../../services/api"
import DashboardCard from "../../components/dashboard/DashboardCard"
import RecentActivityList from "../../components/dashboard/RecentActivityList"

const ResidentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [events, setEvents] = useState([])
  const [notifications, setNotifications] = useState([])
  const [maintenanceReports, setMaintenanceReports] = useState([])
  const [loading, setLoading] = useState({
    bookings: true,
    events: true,
    notifications: true,
    maintenance: true,
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch bookings
        const bookingsResponse = await api.get("/bookings/my-bookings")
        setBookings(

          //@ts-ignore
          bookingsResponse.data.data.slice(0, 5).map((booking) => ({
            id: booking.booking_id,
            title: booking.facility?.name || "Facility Booking",
            subtitle: `${booking.purpose} (${booking.attendees} attendees)`,
            date: `${new Date(booking.date).toLocaleDateString()} • ${booking.start_time} - ${booking.end_time}`,
            status: booking.status,
            statusColor: getStatusColor(booking.status),
            rawData: booking,
          })),
        )
        setLoading((prev) => ({ ...prev, bookings: false }))

        // Fetch events
        const eventsResponse = await api.get("/events")
        setEvents(

          //@ts-ignore
          eventsResponse.data.data.slice(0, 5).map((event) => ({
            id: event.event_id,
            title: event.title,
            subtitle: event.facility?.name || "Community Event",
            date: `${new Date(event.start_date).toLocaleDateString()} • ${event.start_time}`,
            status: event.status,
            statusColor: getStatusColor(event.status),
            rawData: event,
          })),
        )
        setLoading((prev) => ({ ...prev, events: false }))

        // Fetch notifications
        const notificationsResponse = await api.get("/notifications")
        setNotifications(
          //@ts-ignore
          notificationsResponse.data.data.slice(0, 5).map((notification) => ({
            id: notification.notification_id,
            title: notification.title,
            subtitle: notification.message,
            date: new Date(notification.created_at).toLocaleDateString(),
            status: notification.read ? "Read" : "Unread",
            statusColor: notification.read ? "default" : "info",
            rawData: notification,
          })),
        )
        setLoading((prev) => ({ ...prev, notifications: false }))

        // Fetch maintenance reports
        const maintenanceResponse = await api.get("/maintenance/my-reports")
        setMaintenanceReports(
          //@ts-ignore
          maintenanceResponse.data.data.slice(0, 5).map((report) => ({
            id: report.report_id,
            title: report.title,
            subtitle: report.facility?.name || "Maintenance Report",
            date: new Date(report.reported_date).toLocaleDateString(),
            status: report.status,
            statusColor: getMaintenanceStatusColor(report.status),
            rawData: report,
          })),
        )
        setLoading((prev) => ({ ...prev, maintenance: false }))
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        //@ts-ignore
        setError("Failed to load dashboard data. Please try again later.")
      }
    }

    fetchDashboardData()
  }, [])
//@ts-ignore
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "completed":
      case "open":
        return "success"
      case "pending":
      case "in-progress":
      case "scheduled":
        return "warning"
      case "rejected":
      case "cancelled":
      case "closed":
        return "error"
      default:
        return "default"
    }
  }
//@ts-ignore
  const getMaintenanceStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success"
      case "in-progress":
      case "scheduled":
        return "warning"
      case "reported":
        return "info"
      default:
        return "default"
    }
  }
//@ts-ignore
  const handleCancelBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`)
      // Refresh bookings
      const bookingsResponse = await api.get("/bookings/my-bookings")
      setBookings(
        //@ts-ignore
        bookingsResponse.data.data.slice(0, 5).map((booking) => ({
          id: booking.booking_id,
          title: booking.facility?.name || "Facility Booking",
          subtitle: `${booking.purpose} (${booking.attendees} attendees)`,
          date: `${new Date(booking.date).toLocaleDateString()} • ${booking.start_time} - ${booking.end_time}`,
          status: booking.status,
          statusColor: getStatusColor(booking.status),
          rawData: booking,
        })),
      )
    } catch (err) {
      console.error("Error cancelling booking:", err)
    }
  }
//@ts-ignore
  const handleRegisterForEvent = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/register`)
      // Refresh events
      const eventsResponse = await api.get("/events")
      setEvents(
        //@ts-ignore
        eventsResponse.data.data.slice(0, 5).map((event) => ({
          id: event.event_id,
          title: event.title,
          subtitle: event.facility?.name || "Community Event",
          date: `${new Date(event.start_date).toLocaleDateString()} • ${event.start_time}`,
          status: event.status,
          statusColor: getStatusColor(event.status),
          rawData: event,
        })),
      )
    } catch (err) {
      console.error("Error registering for event:", err)
    }
  }
//@ts-ignore
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      // Refresh notifications
      const notificationsResponse = await api.get("/notifications")
      setNotifications(
        //@ts-ignore
        notificationsResponse.data.data.slice(0, 5).map((notification) => ({
          id: notification.notification_id,
          title: notification.title,
          subtitle: notification.message,
          date: new Date(notification.created_at).toLocaleDateString(),
          status: notification.read ? "Read" : "Unread",
          statusColor: notification.read ? "default" : "info",
          rawData: notification,
        })),
      )
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  // Calculate statistics
  const activeBookingsCount = bookings.filter(
    //@ts-ignore
    (b) => b.rawData.status === "approved" || b.rawData.status === "pending",
  ).length
//@ts-ignore
  const upcomingEventsCount = events.filter((e) => e.rawData.status === "upcoming").length
//@ts-ignore
  const unreadNotificationsCount = notifications.filter((n) => !n.rawData.read).length
//@ts-ignore
  const pendingMaintenanceCount = maintenanceReports.filter((m) => m.rawData.status !== "completed").length

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name?.split(" ")[0] || "Resident"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Active Bookings" value={activeBookingsCount} icon={<CalendarIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Upcoming Events" value={upcomingEventsCount} icon={<EventIcon />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Unread Notifications"
            value={unreadNotificationsCount}
            icon={<NotificationIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Maintenance"
            value={pendingMaintenanceCount}
            icon={<MaintenanceIcon />}
            color="#9c27b0"
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<SportsIcon />} onClick={() => navigate("/bookings/create")}>
                  Book Facility
                </Button>
                <Button variant="outlined" startIcon={<EventIcon />} onClick={() => navigate("/events")}>
                  Browse Events
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MaintenanceIcon />}
                  onClick={() => navigate("/maintenance/create")}
                >
                  Report Issue
                </Button>
                <Button variant="outlined" startIcon={<NotificationIcon />} onClick={() => navigate("/notifications")}>
                  View Notifications
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Bookings */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Recent Bookings"
            activities={bookings}
            emptyMessage="No bookings found"
            loading={loading.bookings}
            viewAllLink="/bookings"
            renderActions={(booking) =>
              //@ts-ignore
              booking.rawData.status === "approved" || booking.rawData.status === "pending" ? (
                <ButtonGroup size="small" variant="outlined">
                  <Button color="primary" onClick={() => navigate(`/bookings/${booking.id}`)}>
                    View
                  </Button>
                  <Button
                    color="error"
                    onClick={() => handleCancelBooking(booking.id)}
                    //@ts-ignore
                    disabled={booking.rawData.status === "cancelled"}
                  >
                    Cancel
                  </Button>
                </ButtonGroup>
              ) : null
            }
          />
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Upcoming Events"
            activities={events}
            emptyMessage="No upcoming events"
            loading={loading.events}
            viewAllLink="/events"
            renderActions={(event) =>
              //@ts-ignore
              event.rawData.status === "upcoming" ? (
                <ButtonGroup size="small" variant="outlined">
                  <Button color="primary" onClick={() => navigate(`/events/${event.id}`)}>
                    View
                  </Button>
                  <Button color="success" onClick={() => handleRegisterForEvent(event.id)}>
                    Register
                  </Button>
                </ButtonGroup>
              ) : null
            }
          />
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Recent Notifications"
            activities={notifications}
            emptyMessage="No notifications"
            loading={loading.notifications}
            viewAllLink="/notifications"
            renderActions={(notification) =>
              //  @ts-ignore
              !notification.rawData.read ? (
                <Button size="small" variant="outlined" onClick={() => handleMarkNotificationAsRead(notification.id)}>
                  Mark as Read
                </Button>
              ) : null
            }
          />
        </Grid>

        {/* Maintenance Reports */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Maintenance Reports"
            activities={maintenanceReports}
            emptyMessage="No maintenance reports"
            loading={loading.maintenance}
            viewAllLink="/maintenance"
            renderActions={(report) => (
              <Button size="small" variant="outlined" onClick={() => navigate(`/maintenance/${report.id}`)}>
                View Details
              </Button>
            )}
          />
        </Grid>
      </Grid>
    </section>
  )
}

export default ResidentDashboard
