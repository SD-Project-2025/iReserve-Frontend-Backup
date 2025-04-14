"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Typography, Grid, Button, Box, Card, CardContent, Alert, ButtonGroup, Tabs, Tab, Paper } from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  SportsTennis as SportsIcon,
  Event as EventIcon,
  People as PeopleIcon,
  SupervisorAccount as AdminIcon,
  Add as AddIcon,
} from "@mui/icons-material"

import { api } from "../../services/api"
import DashboardCard from "../../components/dashboard/DashboardCard"
import RecentActivityList from "../../components/dashboard/RecentActivityList"

// Simple line chart component
//@ts-ignore
const SimpleLineChart = ({ data, title }) => {
  // In a real app, you would use a charting library like recharts or chart.js
  // For this example, we'll just render a placeholder
  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" component="h3" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "action.hover",
          borderRadius: 1,
        }}
      >
        <Typography color="text.secondary">Chart Placeholder - Would render {data.length} data points</Typography>
      </Box>
    </Paper>
  )
}

const AdminDashboard = () => {
 // const { user } = useAuth()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [users, setUsers] = useState<{ 
    id: number; 
    title: string; 
    subtitle: string; 
    date: string; 
    status: string; 
    statusColor: string; 
    rawData: { user_id: number; name: string; type: string; status: string; }; 
  }[]>([])
  const [bookings, setBookings] = useState([])
  const [facilities, setFacilities] = useState([])
  const [maintenanceReports, setMaintenanceReports] = useState([])
  const [loading, setLoading] = useState({
    users: true,
    bookings: true,
    facilities: true,
    maintenance: true,
  })
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResidents: 0,
    totalStaff: 0,
    totalFacilities: 0,
    totalBookings: 0,
    totalEvents: 0,
    totalMaintenance: 0,
  })

  // Mock data for charts
  const [bookingTrends] = useState([
    { date: "2023-01", count: 45 },
    { date: "2023-02", count: 52 },
    { date: "2023-03", count: 49 },
    { date: "2023-04", count: 63 },
    { date: "2023-05", count: 58 },
    { date: "2023-06", count: 72 },
  ])

  const [facilityUsage] = useState([
    { name: "Basketball Court", usage: 78 },
    { name: "Swimming Pool", usage: 92 },
    { name: "Tennis Court", usage: 45 },
    { name: "Gym", usage: 86 },
    { name: "Soccer Field", usage: 63 },
  ])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, you would have endpoints for these admin statistics
        // For this example, we'll use the existing endpoints and calculate stats

        // Fetch users (mock - in a real app, you would have an admin endpoint)
        // This is a placeholder since we don't have a users endpoint in our API
        setUsers([
          {
            id: 1,
            title: "John Doe",
            subtitle: "Resident • Standard Membership",
            date: "Joined: Jan 15, 2023",
            status: "active",
            statusColor: "success",
            rawData: { user_id: 1, name: "John Doe", type: "resident", status: "active" },
          },
          {
            id: 2,
            title: "Jane Smith",
            subtitle: "Staff • Facility Manager",
            date: "Joined: Mar 5, 2023",
            status: "active",
            statusColor: "success",
            rawData: { user_id: 2, name: "Jane Smith", type: "staff", status: "active" },
          },
          {
            id: 3,
            title: "Bob Johnson",
            subtitle: "Resident • Premium Membership",
            date: "Joined: Feb 20, 2023",
            status: "active",
            statusColor: "success",
            rawData: { user_id: 3, name: "Bob Johnson", type: "resident", status: "active" },
          },
        ])
        setLoading((prev) => ({ ...prev, users: false }))

        // Update user stats
        setStats((prev) => ({
          ...prev,
          totalUsers: 50, // Mock data
          totalResidents: 45,
          totalStaff: 5,
        }))

        // Fetch bookings
        const bookingsResponse = await api.get("/bookings")
        const bookingsData = bookingsResponse.data.data
        setBookings(
          //@ts-ignore
          bookingsData.slice(0, 5).map((booking) => ({
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

        // Update booking stats
        setStats((prev) => ({
          ...prev,
          totalBookings: bookingsData.length,
        }))

        // Fetch facilities
        const facilitiesResponse = await api.get("/facilities")
        const facilitiesData = facilitiesResponse.data.data
        setFacilities(
          //@ts-ignore
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

        // Update facility stats
        setStats((prev) => ({
          ...prev,
          totalFacilities: facilitiesData.length,
        }))

        // Fetch maintenance reports
        const maintenanceResponse = await api.get("/maintenance")
        const maintenanceData = maintenanceResponse.data.data
        setMaintenanceReports(
          //@ts-ignore
          maintenanceData.slice(0, 5).map((report) => ({
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

        // Update maintenance stats
        setStats((prev) => ({
          ...prev,
          totalMaintenance: maintenanceData.length,
        }))

        // Fetch events (mock - we already have the count from staff dashboard)
        setStats((prev) => ({
          ...prev,
          totalEvents: 12, // Mock data
        }))
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        // @ts-ignore
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
      case "active":
        return "success"
      case "pending":
      case "in-progress":
      case "scheduled":
        return "warning"
      case "rejected":
      case "cancelled":
      case "closed":
      case "maintenance":
      case "inactive":
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
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Users" value={stats.totalUsers} icon={<PeopleIcon />} color="#1976d2">
            <Typography variant="body2" color="text.secondary">
              {stats.totalResidents} Residents, {stats.totalStaff} Staff
            </Typography>
          </DashboardCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Facilities" value={stats.totalFacilities} icon={<SportsIcon />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Bookings" value={stats.totalBookings} icon={<CalendarIcon />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Events" value={stats.totalEvents} icon={<EventIcon />} color="#9c27b0" />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Admin Actions
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<AdminIcon />} onClick={() => navigate("/admin/users")}>
                  Manage Users
                </Button>
                <Button variant="outlined" startIcon={<SportsIcon />} onClick={() => navigate("/admin/facilities")}>
                  Manage Facilities
                </Button>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate("/admin/facilities/create")}>
                  Add Facility
                </Button>
                <Button variant="outlined" startIcon={<EventIcon />} onClick={() => navigate("/admin/events/create")}>
                  Create Event
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <SimpleLineChart data={bookingTrends} title="Booking Trends (Last 6 Months)" />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimpleLineChart data={facilityUsage} title="Facility Usage Statistics" />
        </Grid>

        {/* Tabs for different sections */}
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin dashboard tabs">
              <Tab label="Users" id="tab-0" aria-controls="tabpanel-0" />
              <Tab label="Facilities" id="tab-1" aria-controls="tabpanel-1" />
              <Tab label="Bookings" id="tab-2" aria-controls="tabpanel-2" />
              <Tab label="Maintenance" id="tab-3" aria-controls="tabpanel-3" />
            </Tabs>
          </Box>

          {/* Users Tab */}
          <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" aria-labelledby="tab-0" sx={{ mt: 2 }}>
            {tabValue === 0 && (
              <RecentActivityList
                title="Recent Users"
                //@ts-ignore
                activities={users}
                emptyMessage="No users found"
                loading={loading.users}
                viewAllLink="/admin/users"
                renderActions={(user) => (
                  <ButtonGroup size="small" variant="outlined">
                    <Button color="primary" onClick={() => navigate(`/admin/users/${user.id}`)}>
                      View
                    </Button>
                    <Button color="primary" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                      Edit
                    </Button>
                    {user.rawData.status === "active" ? (
                      <Button color="error" onClick={() => console.log("Deactivate user", user.id)}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button color="success" onClick={() => console.log("Activate user", user.id)}>
                        Activate
                      </Button>
                    )}
                  </ButtonGroup>
                )}
              />
            )}
          </Box>

          {/* Facilities Tab */}
          <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" aria-labelledby="tab-1" sx={{ mt: 2 }}>
            {tabValue === 1 && (
              <RecentActivityList
                title="Facilities"
                activities={facilities}
                emptyMessage="No facilities found"
                loading={loading.facilities}
                viewAllLink="/admin/facilities"
                renderActions={(facility) => (
                  <ButtonGroup size="small" variant="outlined">
                    <Button color="primary" onClick={() => navigate(`/admin/facilities/${facility.id}`)}>
                      View
                    </Button>
                    <Button color="primary" onClick={() => navigate(`/admin/facilities/${facility.id}/edit`)}>
                      Edit
                    </Button>
                    <Button color="error" onClick={() => console.log("Delete facility", facility.id)}>
                      Delete
                    </Button>
                  </ButtonGroup>
                )}
              />
            )}
          </Box>

          {/* Bookings Tab */}
          <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" aria-labelledby="tab-2" sx={{ mt: 2 }}>
            {tabValue === 2 && (
              <RecentActivityList
                title="Recent Bookings"
                activities={bookings}
                emptyMessage="No bookings found"
                loading={loading.bookings}
                viewAllLink="/admin/bookings"
                renderActions={(booking) => (
                  <ButtonGroup size="small" variant="outlined">
                    <Button color="primary" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                      View
                    </Button>
                    {booking.rawData.status === "pending" && (
                      <>
                        <Button color="success" onClick={() => console.log("Approve booking", booking.id)}>
                          Approve
                        </Button>
                        <Button color="error" onClick={() => console.log("Reject booking", booking.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                  </ButtonGroup>
                )}
              />
            )}
          </Box>

          {/* Maintenance Tab */}
          <Box role="tabpanel" hidden={tabValue !== 3} id="tabpanel-3" aria-labelledby="tab-3" sx={{ mt: 2 }}>
            {tabValue === 3 && (
              <RecentActivityList
                title="Maintenance Reports"
                activities={maintenanceReports}
                emptyMessage="No maintenance reports found"
                loading={loading.maintenance}
                viewAllLink="/admin/maintenance"
                renderActions={(report) => (
                  <ButtonGroup size="small" variant="outlined">
                    <Button color="primary" onClick={() => navigate(`/admin/maintenance/${report.id}`)}>
                      View
                    </Button>
                    <Button color="primary" onClick={() => navigate(`/admin/maintenance/${report.id}/assign`)}>
                      Assign
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

export default AdminDashboard
