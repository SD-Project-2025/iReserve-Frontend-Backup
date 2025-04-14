"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CircularProgress, Box } from "@mui/material"
import { useAuth } from "../../contexts/AuthContext"
import ResidentDashboard from "../resident/ResidentDashboard"
import StaffDashboard from "../staff/StaffDashboard"
import AdminDashboard from "../admin/AdminDashboard"
import { useState } from "react"
import { api } from "@/services/api"

interface Booking {
  booking_id: number
  facility_name: string
  date: string
  start_time: string
  end_time: string
  status: string
}

interface Facility {
  facility_id: number
  name: string
  type: string
  status: string
}

interface Event {
  event_id: number
  title: string
  start_date: string
  end_date: string
}

interface Notification {
  notification_id: number
  title: string
  message: string
  type: string
  created_at: string
  read: boolean
}

const DashboardPage = () => {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
const ss = [bookings, facilities, events, notifications,apiLoading, error]
  console.log("DashboardPage State:", ss)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, loading, navigate])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setApiLoading(true)
        setError(null)

        // Fetch upcoming bookings
        const bookingsResponse = await api.get("/bookings/my-bookings")
        setBookings(bookingsResponse.data.data.slice(0, 5))

        // Fetch available facilities
        const facilitiesResponse = await api.get("/facilities")
        setFacilities(facilitiesResponse.data.data.slice(0, 5))

        // Fetch upcoming events
        const eventsResponse = await api.get("/events")
        setEvents(eventsResponse.data.data.slice(0, 5))

        // Fetch notifications
        const notificationsResponse = await api.get("/notifications")
        setNotifications(notificationsResponse.data.data.slice(0, 5))
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setApiLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  // For development, allow testing different dashboards
  //@ts-ignore
  if (import.meta.env.DEV) {
    // You can change this to test different dashboards
    const dashboardType = user?.type || "resident"

    if (dashboardType === "staff") {
      // Check if user has admin privileges (for testing admin dashboard)
      const isAdmin = localStorage.getItem("testAdminDashboard") === "true"

      if (isAdmin) {
        return <AdminDashboard />
      } else {
        return <StaffDashboard />
      }
    }
  }

  // Default to resident dashboard
  return <ResidentDashboard />
}

export default DashboardPage
