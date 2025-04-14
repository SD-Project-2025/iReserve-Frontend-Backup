"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Typography, Grid, Button, Box, Card, CardContent, Alert, ButtonGroup, Tabs, Tab } from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  SportsTennis as SportsIcon,
  Event as EventIcon,
  Build as MaintenanceIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"
import { useAuth } from "../../contexts/AuthContext"
import { api } from "../../services/api"
import DashboardCard from "../../components/dashboard/DashboardCard"
import RecentActivityList from "../../components/dashboard/RecentActivityList"

const StaffDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [bookings, setBookings] = useState([])
  const [facilities, setFacilities] = useState([])
  const [maintenanceReports, setMaintenanceReports] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState({
    bookings: true,
    facilities: true,
    maintenance: true,
    events: true,
  })
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    pendingBookings: 0,
    activeFacilities: 0,
    pendingMaintenance: 0,
    upcomingEvents: 0,
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch bookings
        const bookingsResponse = await api.get("/bookings")
        const bookingsData = bookingsResponse.data.data.slice(0, 10)
        setBookings(
          bookingsData.map((booking) => ({
            id: booking.booking_id,
            title: `${booking.facility?.name || "Facility"} Booking`,
            subtitle: `${booking.purpose} (${booking.attendees} attendees)`,
            date: `${new Date(booking.date).toLocaleDateString()} • ${booking.start_time} - ${booking.end_time}`,
            status: booking.status,
            statusColor: getStatusColor(booking.status),
            rawData: booking,
          })),
        )
        setLoading((prev) => ({ ...prev, bookings: false }))

        // Update stats
        setStats((prev) => ({
          ...prev,
          pendingBookings: bookingsData.filter((b) => b.status === "pending").length,
        }))

        // Fetch facilities
        const facilitiesResponse = await api.get("/facilities")
        const facilitiesData = facilitiesResponse.data.data
        setFacilities(
          facilitiesData.map((facility) => ({
            id: facility.facility_id,
            title: facility.name,
            subtitle: `${facility.type} • ${facility.location}`,
            date: `${facility.open_time} - ${facility.close_time}`,
            status: facility.status,
            statusColor: getStatusColor(facility.status),
            rawData: facility,
          })),
        )
        setLoading((prev) => ({ ...prev, facilities: false }))

        // Update stats
        setStats((prev) => ({
          ...prev,
          activeFacilities: facilitiesData.filter((f) => f.status === "open").length,
        }))

        // Fetch maintenance reports
        const maintenanceResponse = await api.get("/maintenance")
        const maintenanceData = maintenanceResponse.data.data.slice(0, 10)
        setMaintenanceReports(
          maintenanceData.map((report) => ({
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

        // Update stats
        setStats((prev) => ({
          ...prev,
          pendingMaintenance: maintenanceData.filter((m) => m.status === "reported" || m.status === "in-progress")
            .length,
        }))

        // Fetch events
        const eventsResponse = await api.get("/events")
        const eventsData = eventsResponse.data.data.slice(0, 10)
        setEvents(
          eventsData.map((event) => ({
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

        // Update stats
        setStats((prev) => ({
          ...prev,
          upcomingEvents: eventsData.filter((e) => e.status === "upcoming").length,
        }))
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      }
    }

    fetchDashboardData()
  }, [])

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
      case "maintenance":
        return "error"
      default:
        return "default"
    }
  }

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

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status })
      // Refresh bookings
      const bookingsResponse = await api.get("/bookings")
      const bookingsData = bookingsResponse.data.data.slice(0, 10)
      setBookings(
        bookingsData.map((booking) => ({
          id: booking.booking_id,
          title: `${booking.facility?.name || "Facility"} Booking`,
          subtitle: `${booking.purpose} (${booking.attendees} attendees)`,
          date: `${new Date(booking.date).toLocaleDateString()} • ${booking.start_time} - ${booking.end_time}`,
          status: booking.status,
          statusColor: getStatusColor(booking.status),
          rawData: booking,
        })),
      )

      // Update stats
      setStats((prev) => ({
        ...prev,
        pendingBookings: bookingsData.filter((b) => b.status === "pending").length,
      }))
    } catch (err) {
      console.error("Error updating booking status:", err)
    }
  }

  const handleUpdateMaintenanceStatus = async (reportId, status) => {
    try {
      await api.put(`/maintenance/${reportId}/status`, { status })
      // Refresh maintenance reports
      const maintenanceResponse = await api.get("/maintenance")
      const maintenanceData = maintenanceResponse.data.data.slice(0, 10)
      setMaintenanceReports(
        maintenanceData.map((report) => ({
          id: report.report_id,
          title: report.title,
          subtitle: report.facility?.name || "Maintenance Report",
          date: new Date(report.reported_date).toLocaleDateString(),
          status: report.status,
          statusColor: getMaintenanceStatusColor(report.status),
          rawData: report,
        })),
      )

      // Update stats
      setStats((prev) => ({
        ...prev,
        pendingMaintenance: maintenanceData.filter((m) => m.status === "reported" || m.status === "in-progress").length,
      }))
    } catch (err) {
      console.error("Error updating maintenance status:", err)
    }
  }

  const handleUpdateFacilityStatus = async (facilityId, status) => {
    try {
      await api.put(`/facilities/${facilityId}`, { status })
      // Refresh facilities
      const facilitiesResponse = await api.get("/facilities")
      const facilitiesData = facilitiesResponse.data.data
      setFacilities(
        facilitiesData.map((facility) => ({
          id: facility.facility_id,
          title: facility.name,
          subtitle: `${facility.type} • ${facility.location}`,
          date: `${facility.open_time} - ${facility.close_time}`,
          status: facility.status,
          statusColor: getStatusColor(facility.status),
          rawData: facility,
        })),
      )

      // Update stats
      setStats((prev) => ({
        ...prev,
        activeFacilities: facilitiesData.filter((f) => f.status === "open").length,
      }))
    } catch (err) {
      console.error("Error updating facility status:", err)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Staff Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Bookings"
            value={stats.pendingBookings}
            icon={<CalendarIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Active Facilities"
            value={stats.activeFacilities}
            icon={<SportsIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Maintenance"
            value={stats.pendingMaintenance}
            icon={<MaintenanceIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Upcoming Events" value={stats.upcomingEvents} icon={<EventIcon />} color="#9c27b0" />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<AssignmentIcon />} onClick={() => navigate("/admin/bookings")}>
                  Manage Bookings
                </Button>
                <Button variant="outlined" startIcon={<SportsIcon />} onClick={() => navigate("/admin/facilities")}>
                  Manage Facilities
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MaintenanceIcon />}
                  onClick={() => navigate("/admin/maintenance")}
                >
                  Manage Maintenance
                </Button>
                <Button variant="outlined" startIcon={<EventIcon />} onClick={() => navigate("/admin/events")}>
                  Manage Events
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabs for different sections */}
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
              <Tab label="Bookings" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="Facilities" id="tab-1" aria-controls="tabpanel-1" />
              <Tab label="Maintenance" id="tab-2" aria-controls="tabpanel-2" />
              <Tab label="Events" id="tab-3" aria-controls="tabpanel-3" />
            </Tabs>
          </Box>

          {/* Bookings Tab */}
          <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" aria-labelledby="tab-0" sx={{ mt: 2 }}>
            {tabValue === 0 && (
              <RecentActivityList
                title="Recent Booking Requests"
                activities={bookings.filter((b) => b.rawData.status === "pending")}
                emptyMessage="No pending booking requests"
                loading={loading.bookings}
                viewAllLink="/admin/bookings"
                renderActions={(booking) => (
                  <ButtonGroup size="small" variant="outlined">
                    <Button color="success" onClick={() => handleUpdateBookingStatus(booking.id, "approved")}>
                      Approve
                    </Button>
                    <Button color="error" onClick={() => handleUpdateBookingStatus(booking.id, "rejected")}>
                      Reject
                    </Button>
                    <Button color="primary" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                      View
                    </Button>
                  </ButtonGroup>
                )}
              />
            )}
          </Box>

          {/* Facilities Tab */}
          <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" aria-labelledby="tab-1" sx={{ mt: 2 }}>
            {tabValue === 1 && (
              <RecentActivityList
                title="Facility Status"
                activities={facilities}
                emptyMessage="No facilities found"
                loading={loading.facilities}
                viewAllLink="/admin/facilities"
                renderActions={(facility) => (
                  <ButtonGroup size="small" variant="outlined">
                    {facility.rawData.status !== "open" && (
                      <Button color="success" onClick={() => handleUpdateFacilityStatus(facility.id, "open")}>
                        Set Open
                      </Button>
                    )}
                    {facility.rawData.status !== "closed" && (
                      <Button color="error" onClick={() => handleUpdateFacilityStatus(facility.id, "closed")}>
                        Set Closed
                      </Button>
                    )}
                    {facility.rawData.status !== "maintenance" && (
                      <Button color="warning" onClick={() => handleUpdateFacilityStatus(facility.id, "maintenance")}>
                        Set Maintenance
                      </Button>
                    )}
                    <Button color="primary" onClick={() => navigate(`/admin/facilities/${facility.id}`)}>
                      View
                    </Button>
                  </ButtonGroup>
                )}
              />
            )}
          </Box>

          {/* Maintenance Tab */}
          <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" aria-labelledby="tab-2" sx={{ mt: 2 }}>
            {tabValue === 2 && (
              <RecentActivityList
                title="Maintenance Reports"
                activities={maintenanceReports}
                emptyMessage="No maintenance reports found"
                loading={loading.maintenance}
                viewAllLink="/admin/maintenance"
                renderActions={(report) => (
                  <ButtonGroup size="small" variant="outlined">
                    {report.rawData.status === "reported" && (
                      <Button color="warning" onClick={() => handleUpdateMaintenanceStatus(report.id, "in-progress")}>
                        Start Work
                      </Button>
                    )}
                    {report.rawData.status === "in-progress" && (
                      <Button color="info" onClick={() => handleUpdateMaintenanceStatus(report.id, "scheduled")}>
                        Schedule
                      </Button>
                    )}
                    {(report.rawData.status === "in-progress" || report.rawData.status === "scheduled") && (
                      <Button color="success" onClick={() => handleUpdateMaintenanceStatus(report.id, "completed")}>
                        Complete
                      </Button>
                    )}
                    <Button color="primary" onClick={() => navigate(`/admin/maintenance/${report.id}`)}>
                      View
                    </Button>
                  </ButtonGroup>
                )}
              />
            )}
          </Box>

          {/* Events Tab */}
          <Box role="tabpanel" hidden={tabValue !== 3} id="tabpanel-3" aria-labelledby="tab-3" sx={{ mt: 2 }}>
            {tabValue === 3 && (
              <RecentActivityList
                title="Upcoming Events"
                activities={events}
                emptyMessage="No events found"
                loading={loading.events}
                viewAllLink="/admin/events"
                renderActions={(event) => (
                  <ButtonGroup size="small" variant="outlined">
                    <Button color="primary" onClick={() => navigate(`/admin/events/${event.id}`)}>
                      View
                    </Button>
                    <Button color="primary" onClick={() => navigate(`/admin/events/${event.id}/edit`)}>
                      Edit
                    </Button>
                  </ButtonGroup>
                )}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </section>
  )
}

export default StaffDashboard
