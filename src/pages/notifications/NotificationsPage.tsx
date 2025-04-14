"use client"

import { useState, useEffect } from "react"
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material"
import { api } from "@/services/api"

interface Notification {
  notification_id: number
  title: string
  message: string
  type: string
  created_at: string
  read: boolean
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/notifications")
        setNotifications(response.data.data)
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setError("Failed to load notifications. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      // Update the notification in the state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.notification_id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all")
      // Update all notifications in the state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "booking":
        return "primary"
      case "event":
        return "success"
      case "maintenance":
        return "warning"
      case "announcement":
        return "info"
      default:
        return "default"
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
        {unreadCount > 0 && (
          <Button variant="outlined" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length > 0 ? (
            <List>
              {notifications.map((notification, index) => (
                <Box key={notification.notification_id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      py: 2,
                      bgcolor: notification.read ? "transparent" : "action.hover",
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography
                            variant="subtitle1"
                            component="div"
                            sx={{ fontWeight: notification.read ? 400 : 500 }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type}
                            size="small"
                            color={getNotificationTypeColor(notification.type) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" display="block" sx={{ mt: 1 }}>
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {new Date(notification.created_at).toLocaleString()}
                            </Typography>
                            {!notification.read && (
                              <Button size="small" onClick={() => handleMarkAsRead(notification.notification_id)}>
                                Mark as Read
                              </Button>
                            )}
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No notifications found</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default NotificationsPage
