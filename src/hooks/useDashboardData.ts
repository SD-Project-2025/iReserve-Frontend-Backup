import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Booking, Facility, ActivityItem } from "../types/dashboardTypes";
import { getActiveBookingsWithFacilities, getStatusColor, getMaintenanceStatusColor } from "../utils/dashboardUtils";

export const useDashboardData = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [maintenanceReports, setMaintenanceReports] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState({
    bookings: true,
    events: true,
    notifications: true,
    maintenance: true,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [bookingsResponse, facilitiesResponse] = await Promise.all([
        api.get<{ data: Booking[] }>("/bookings/my-bookings"),
        api.get<{ data: Facility[] }>("/facilities")
      ]);

      const activeBookingsWithFacilities = getActiveBookingsWithFacilities(
        bookingsResponse.data.data,
        facilitiesResponse.data.data
      );

      setBookings(
        activeBookingsWithFacilities.map(booking => ({
          booking_id: booking.booking_id,
          facility_id: booking.facility_id,
          facility: booking.facility,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          purpose: booking.purpose,
          attendees: booking.attendees,
        }))
      );
      setLoading(prev => ({ ...prev, bookings: false }));

      const eventsResponse = await api.get("/events");
      setEvents(
        eventsResponse.data.data.slice(0, 5).map((event: any) => ({
          id: event.event_id,
          title: event.title,
          subtitle: event.facility?.name || "Community Event",
          date: `${new Date(event.start_date).toLocaleDateString()} • ${event.start_time}`,
          status: event.status,
          statusColor: getStatusColor(event.status),
          rawData: event,
        }))
      );
      setLoading(prev => ({ ...prev, events: false }));

      const notificationsResponse = await api.get("/notifications");
      setNotifications(
        notificationsResponse.data.data.slice(0, 5).map((notification: any) => ({
          id: notification.notification_id,
          title: notification.title,
          subtitle: notification.message,
          date: new Date(notification.created_at).toLocaleDateString(),
          status: notification.read ? "Read" : "Unread",
          statusColor: notification.read ? "default" : "info",
          rawData: notification,
        }))
      );
      setLoading(prev => ({ ...prev, notifications: false }));

      const maintenanceResponse = await api.get("/maintenance/my-reports");
      setMaintenanceReports(
        maintenanceResponse.data.data.slice(0, 5).map((report: any) => ({
          id: report.report_id,
          title: report.title,
          subtitle: report.facility?.name || "Maintenance Report",
          date: new Date(report.reported_date).toLocaleDateString(),
          status: report.status,
          statusColor: getMaintenanceStatusColor(report.status),
          rawData: report,
        }))
      );
      setLoading(prev => ({ ...prev, maintenance: false }));

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      const bookingsResponse = await api.get<{ data: Booking[] }>("/bookings/my-bookings");
      setBookings(
        bookingsResponse.data.data.slice(0, 6).map((booking) => ({
          booking_id: booking.booking_id,
          facility_id: booking.facility_id,
          facility: booking.facility,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          purpose: booking.purpose,
          attendees: booking.attendees,
        }))
      );
    } catch (err) {
      console.error("Error cancelling booking:", err);
    }
  };

  const handleRegisterForEvent = async (eventId: number) => {
    try {
      await api.post(`/events/${eventId}/register`);
      const eventsResponse = await api.get("/events");
      setEvents(
        eventsResponse.data.data.slice(0, 5).map((event: any) => ({
          id: event.event_id,
          title: event.title,
          subtitle: event.facility?.name || "Community Event",
          date: `${new Date(event.start_date).toLocaleDateString()} • ${event.start_time}`,
          status: event.status,
          statusColor: getStatusColor(event.status),
          rawData: event,
        }))
      );
    } catch (err) {
      console.error("Error registering for event:", err);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      const notificationsResponse = await api.get("/notifications");
      setNotifications(
        notificationsResponse.data.data.slice(0, 5).map((notification: any) => ({
          id: notification.notification_id,
          title: notification.title,
          subtitle: notification.message,
          date: new Date(notification.created_at).toLocaleDateString(),
          status: notification.read ? "Read" : "Unread",
          statusColor: notification.read ? "default" : "info",
          rawData: notification,
        }))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    bookings,
    events,
    notifications,
    maintenanceReports,
    loading,
    error,
    handleCancelBooking,
    handleRegisterForEvent,
    handleMarkNotificationAsRead
  };
};