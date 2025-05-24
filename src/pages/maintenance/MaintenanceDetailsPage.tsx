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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab"
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Build as BuildIcon,
  Flag as FlagIcon,
  Comment as CommentIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

interface MaintenanceReport {
  report_id: number
  title: string
  description: string
  Facility: {
    facility_id: number
    name: string
    location: string
  }
  user: {
    user_id: number
    name: string
    email?: string
  }
  reported_date: string
  status: string
  priority: string
  assigned_to?: {
    user_id: number
    name: string
  }
  comments?: Array<{
    id: number
    user: {
      name: string
      user_id: number
    }
    text: string
    created_at: string
  }>
  history?: Array<{
    id: number
    status: string
    created_at: string
    user?: {
      name: string
    }
    notes?: string
  }>
}

const MaintenanceDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [report, setReport] = useState<MaintenanceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get(`/maintenance/${id}`)
        setReport(response.data.data)
        console.log("data", response.data.data)
      } catch (err) {
        console.error("Error fetching maintenance report:", err)
        setError("Failed to load maintenance report. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchReportDetails()
    }
  }, [id])

  const handleAddComment = async () => {
    if (!commentText.trim()) return

    try {
      setSubmitting(true)
      await api.post(`/maintenance/${id}/comments`, { text: commentText })

      // Refresh report data
      const response = await api.get(`/maintenance/${id}`)
      setReport(response.data.data)
      setCommentText("")
    } catch (err) {
      console.error("Error adding comment:", err)
      setError("Failed to add comment. Please try again later.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) return

    try {
      setSubmitting(true)
      await api.put(`/maintenance/${id}/status`, {
        status: newStatus,
        notes: statusNote,
      })

      // Refresh report data
      const response = await api.get(`/maintenance/${id}`)
      setReport(response.data.data)
      setStatusDialogOpen(false)
      setNewStatus("")
      setStatusNote("")
    } catch (err) {
      console.error("Error updating status:", err)
      setError("Failed to update status. Please try again later.")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success"
      case "in-progress":
      case "scheduled":
        return "warning"
      case "reported":
        return "info"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "error"
      case "medium":
        return "warning"
      case "low":
        return "info"
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

  if (!report) {
    return <Alert severity="info">Maintenance report not found.</Alert>
  }

  const isStaff = user?.type === "staff"
  const canUpdateStatus = isStaff && report.status !== "completed" && report.status !== "cancelled"

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Maintenance Report
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label={report.priority}
            color={getPriorityColor(report.priority) as any}
            icon={<FlagIcon />}
            sx={{ mr: 1 }}
          />
          <Chip label={report.status} color={getStatusColor(report.status) as any} icon={<BuildIcon />} />
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {report.title}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography>
                  {report.Facility?.name} • {report.Facility?.location}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CalendarIcon color="action" sx={{ mr: 1 }} />
                <Typography>Reported on {new Date(report.reported_date).toLocaleDateString()}</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PersonIcon color="action" sx={{ mr: 1 }} />
                <Typography>Reported by {report.user?.name}</Typography>
              </Box>

              {report.assigned_to && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <BuildIcon color="action" sx={{ mr: 1 }} />
                  <Typography>Assigned to {report.assigned_to.name}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography paragraph>{report.description}</Typography>

              {report.history && report.history.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Status History
                  </Typography>
                  <Timeline position="alternate">
                    {report.history.map((item) => (
                      <TimelineItem key={item.id}>
                        <TimelineOppositeContent color="text.secondary">
                          {new Date(item.created_at).toLocaleString()}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={getStatusColor(item.status) as any}>
                            {item.status === "reported" && <FlagIcon />}
                            {item.status === "in-progress" && <BuildIcon />}
                            {item.status === "scheduled" && <ScheduleIcon />}
                            {item.status === "completed" && <CompleteIcon />}
                          </TimelineDot>
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="h6" component="span">
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Typography>
                          <Typography>
                            {item.user?.name && `By ${item.user.name}`}
                            {item.notes && <Box sx={{ mt: 1 }}>{item.notes}</Box>}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </>
              )}

              {report.comments && report.comments.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Comments
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {report.comments.map((comment) => (
                      <Card key={comment.id} sx={{ mb: 2, bgcolor: "background.default" }}>
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="subtitle2">{comment.user.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2">{comment.text}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </>
              )}

              <Divider sx={{ my: 3 }} />
             
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>

              {canUpdateStatus && (
                <Button variant="contained" fullWidth sx={{ mb: 2 }} onClick={() => setStatusDialogOpen(true)}>
                  Update Status
                </Button>
              )}

              <Button
                variant="outlined"
                fullWidth
                
                sx={{ mb: 2 }}
                onClick={() => navigate(`/admin/facilities/${report.Facility?.facility_id}`,{state:{id:report.Facility?.facility_id}})}
              >
                View Facility
              </Button>

              <Button variant="outlined" fullWidth onClick={() => navigate("/maintenance")}>
                Back to Maintenance Reports
              </Button>
            </CardContent>
          </Card>

          {isStaff && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Staff Actions
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 2 }}
                  onClick={() => navigate(`/admin/maintenance/${report.report_id}`)}
                >
                  View in Admin Panel
                </Button>
                {report.status !== "completed" && report.status !== "cancelled" && (
                  <Button
                    variant="outlined"
                    fullWidth
                    color="success"
                    onClick={() => {
                      setNewStatus("completed")
                      setStatusDialogOpen(true)
                    }}
                  >
                    Mark as Completed
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Maintenance Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Update the status of this maintenance report.</DialogContentText>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)}>
              {report.status !== "reported" && <MenuItem value="reported">Reported</MenuItem>}
              {report.status !== "in-progress" && <MenuItem value="in-progress">In Progress</MenuItem>}
              {report.status !== "scheduled" && <MenuItem value="scheduled">Scheduled</MenuItem>}
              {report.status !== "completed" && <MenuItem value="completed">Completed</MenuItem>}
              
            </Select>
          </FormControl>
         
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} disabled={!newStatus || submitting}>
            Update Status
            {submitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default MaintenanceDetailsPage