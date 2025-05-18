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
import FacilityDetailsPage from "./pages/facilities/FacilityDetailsPage"
import BookingsPage from "./pages/bookings/BookingsPage"
import CreateBookingPage from "./pages/bookings/CreateBookingPage"
import BookingDetailsPage from "./pages/bookings/BookingDetailsPage"
import EventsPage from "./pages/events/EventsPage"
import EventDetailsPage from "./pages/events/EventDetailsPage"
import MaintenancePage from "./pages/maintenance/MaintenancePage"
import CreateMaintenancePage from "./pages/maintenance/CreateMaintenancePage"
import CreateEvent from "./pages/admin/CreateEvent"
import MaintenanceDetailsPage from "./pages/maintenance/MaintenanceDetailsPage"
import ProfilePage from "./pages/profile/ProfilePage"
import NotificationsPage from "./pages/notifications/NotificationsPage"
import PaymentSuccessful from "./pages/payments/PaymentSuccessful"  
import PaymentCancelled from "./pages/payments/PaymentCancelled"
import NotFoundPage from "./pages/NotFoundPage"
import AccessDenied from "./pages/AccessDenied"

// Admin Pages
import ManageFacilitiesPage from "./pages/admin/ManageFacilitiesPage"
import ManageBookingsPage from "./pages/admin/ManageBookingsPage"
import ManageEventsPage from "./pages/admin/ManageEventsPage"
import ManageMaintenancePage from "./pages/admin/ManageMaintenancePage"
import ManageUsersPage from "./pages/admin/ManageUsersPage"
import SystemReportsPage from "./pages/admin/SystemReportsPage"
import ManageNotifications from "./pages/admin/ManageNotifiations"  
import EditEvent from "./components/Events/EditEvent"
import ViewUser from "./components/admin/ViewUser"
import AddFacility from "./pages/admin/AddFacility" // Import the AddFacility component

//Landing Page
import LandingPage from "./LandingPage"
import ExportPdfPage from "./pages/admin/ExportPdfPage"
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
       <Route path="/" element={<LandingPage />} />
      {/* Auth Routes */}
       <Route path="/" element={<LandingPage />} />
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
        <Route path="/facilities/:id" element={<FacilityDetailsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/create" element={<CreateBookingPage />} />
        <Route path="/bookings/:id" element={<BookingDetailsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/maintenance/create" element={<CreateMaintenancePage />} />
        <Route path="/maintenance/:id" element={<MaintenanceDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/payments/:id/success" element={<PaymentSuccessful />} />
        <Route path="/payments/:id/cancelled" element={<PaymentCancelled />} />

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/payments/:id/success" element={<PaymentSuccessful />} />
        <Route path="/payments/:id/cancelled" element={<PaymentCancelled />} />
        <Route path="/export-pdf" element={<ExportPdfPage />} />
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
        {/* Add the facility creation route BEFORE the :id route */}
        <Route path="/admin/facilities/create" element={<AddFacility />} />
        <Route path="/admin/facilities/:id" element={<FacilityDetailsPage />} />
        <Route path="admin/facilities/:id/edit" element={<FacilityDetailsPage />} />

        <Route path="/admin/bookings" element={<ManageBookingsPage />} />
        <Route path="/admin/bookings/:id" element={<BookingDetailsPage />} />
        <Route path="/admin/events" element={<ManageEventsPage />} />
        <Route path="/admin/events/create" element={<CreateEvent />} />
        <Route path="/admin/maintenance" element={<ManageMaintenancePage />} />
        <Route path="/admin/events/create" element={<CreateEvent />} />
        <Route path="/admin/maintenance/:id" element={<MaintenanceDetailsPage />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/users/:id"element={<ViewUser />} />
        <Route path="/admin/reports" element={<SystemReportsPage />} />
        <Route path ="/admin/emaiUser" element={<ManageNotifications/>}/>
        <Route path="/admin/events/:id" element={<EventDetailsPage />} />
       < Route path="/admin/events/:id/edit" element={<EditEvent />} />
        <Route path="/admin/notifications" element={<ManageNotifications />} />
        <Route path="/admin/notifications/:id" element={<NotificationsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
      {/* Access Denied Route */}
      <Route path="/access/denied" element={<AccessDenied />} />
    </Routes>
  )
}

export default App