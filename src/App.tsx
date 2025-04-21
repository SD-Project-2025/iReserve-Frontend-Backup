"use client"

import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"

// Layouts
import MainLayout from "./layouts/MainLayout"
import AuthLayout from "./layouts/AuthLayout"

// Pages
import LoginPage from "./pages/auth/LoginPage"
import AuthCallbackPage from "./pages/auth/AuthCallbackPage"
import DashboardPage from "./pages/dashboard/DashboardPage"
import FacilitiesPage from "./pages/facilities/FacilitiesPage"
import EventDetail from "./pages/events/EventDetail"
import FacilityDetailPage from "./pages/facilities/FacilityDetailPage"
import BookingsPage from "./pages/bookings/BookingsPage"
import CreateBookingPage from "./pages/bookings/CreateBookingPage"
import BookingDetailsPage from "./pages/bookings/BookingDetailsPage"
import EventsPage from "./pages/events/EventsPage"
import EventDetailsPage from "./pages/events/EventDetailsPage"
import MaintenancePage from "./pages/maintenance/MaintenancePage"
import CreateMaintenancePage from "./pages/maintenance/CreateMaintenancePage"
import MaintenanceDetailsPage from "./pages/maintenance/MaintenanceDetailsPage"
import ProfilePage from "./pages/profile/ProfilePage"
import NotificationsPage from "./pages/notifications/NotificationsPage"
import NotFoundPage from "./pages/NotFoundPage"

// Admin Pages
import ManageFacilitiesPage from "./pages/admin/ManageFacilitiesPage"
import ManageBookingsPage from "./pages/admin/ManageBookingsPage"
import ManageEventsPage from "./pages/admin/ManageEventsPage"
import ManageMaintenancePage from "./pages/admin/ManageMaintenancePage"
import ManageUsersPage from "./pages/admin/ManageUsersPage"
import SystemReportsPage from "./pages/admin/SystemReportsPage"

// Protected route component
//@ts-ignore
const ProtectedRoute = ({ children, requiredRole }: { children: any; requiredRole?: any }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <p>Loading...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.type !== requiredRole) {
    // For development without a backend, allow access to admin routes
    //@ts-ignore
    if (import.meta.env.DEV) {
      console.warn(`DEV MODE: Allowing access to ${requiredRole} route even though user is ${user?.type}`)
      return children
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { checkAuth } = useAuth()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Route>

      {/* Main App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        
        <Route path="/facilities/:facilityId" element={<FacilityDetailPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/create" element={<CreateBookingPage />} />
        <Route path="/bookings/:id" element={<BookingDetailsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/maintenance/create" element={<CreateMaintenancePage />} />
        <Route path="/maintenance/:id" element={<MaintenanceDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="staff">
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/facilities" element={<ManageFacilitiesPage />} />
        <Route path="/admin/bookings" element={<ManageBookingsPage />} />
        <Route path="/admin/events" element={<ManageEventsPage />} />
        <Route path="/admin/maintenance" element={<ManageMaintenancePage />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/reports" element={<SystemReportsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
