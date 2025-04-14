"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid"
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"

interface Event {
  event_id: number
  title: string
  description: string
  facility: {
    name: string
    facility_id: number
  }
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
  max_attendees: number
  current_attendees: number
  created_at: string
}

const ManageEventsPage = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterFacility, setFilterFacility] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/events")
        setEvents(response.data.data)
        setFilteredEvents(response.data.data)
      } catch (err) {
        console.error("Error fetching events:", err)
        setError("Failed to load events. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = events

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.facility?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((event) => event.status === filterStatus)
    }

    // Filter by facility
    if (filterFacility !== "all") {
      result = result.filter((event) => event.facility?.facility_id === Number(filterFacility))
    }

    setFilteredEvents(result)
  }, [searchTerm, filterStatus, filterFacility, events])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleStatusChange = (event: any) => {
    setFilterStatus(event.target.value)
  }

  const handleFacilityChange = (event: any) => {
    setFilterFacility(event.target.value)
  }

  const handleDeleteEvent = async () => {
    if (!selectedEventId) return

    try {
      setProcessing(true)
      await api.delete(`/events/${selectedEventId}`)
      // Refresh events
      const response = await api.get("/events")
      setEvents(response.data.data)
      setDeleteDialogOpen(false)
      setSelectedEventId(null)
    } catch (err) {
      console.error("Error deleting event:", err)
      setError("Failed to delete event. Please try again later.")
    } finally {
      setProcessing(false)
    }
  }

  const openDeleteDialog = (id: number) => {
    setSelectedEventId(id)
    setDeleteDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return "success"
      case "ongoing":
        return "warning"
      case "completed":
        return "default"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  // Get unique facilities for filter
  const facilities = [...new Set(events.map((event) => event.facility))]
    .filter((facility): facility is NonNullable<typeof facility> => facility !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))

  const columns: GridColDef[] = [
    { field: "event_id", headerName: "ID", width: 70 },
    { field: "title", headerName: "Title", width: 200 },
    {
      field: "facility",
      headerName: "Facility",
      width: 150,
      valueGetter: (params) => params.row.facility?.name || "Unknown",
    },
    {
      field: "start_date",
      headerName: "Start Date",
      width: 120,
      valueGetter: (params) => new Date(params.row.start_date).toLocaleDateString(),
    },
    {
      field: "end_date",
      headerName: "End Date",
      width: 120,
      valueGetter: (params) => new Date(params.row.end_date).toLocaleDateString(),
    },
    { field: "start_time", headerName: "Start", width: 80 },
    { field: "end_time", headerName: "End", width: 80 },
    {
      field: "attendees",
      headerName: "Attendees",
      width: 120,
      valueGetter: (params) => `${params.row.current_attendees}/${params.row.max_attendees}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getStatusColor(params.value as string) as any} size="small" />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => navigate(`/admin/events/${params.row.event_id}`)}
          >
            View
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/events/${params.row.event_id}/edit`)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => openDeleteDialog(params.row.event_id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ]

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Events
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/admin/events/create")}>
          Create Event
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search events"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" value={filterStatus} label="Status" onChange={handleStatusChange}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="facility-filter-label">Facility</InputLabel>
                <Select
                  labelId="facility-filter-label"
                  value={filterFacility}
                  label="Facility"
                  onChange={handleFacilityChange}
                >
                  <MenuItem value="all">All Facilities</MenuItem>
                  {facilities.map((facility) => (
                    <MenuItem key={facility.facility_id} value={facility.facility_id}>
                      {facility.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ height: 600, width: "100%" }}>
              <DataGrid
                rows={filteredEvents}
                columns={columns}
                getRowId={(row) => row.event_id}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection
                disableRowSelectionOnClick
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleDeleteEvent} color="error" disabled={processing}>
            Delete
            {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default ManageEventsPage
