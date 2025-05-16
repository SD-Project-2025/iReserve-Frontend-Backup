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
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Snackbar,
} from "@mui/material"
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid"
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  EventAvailable as UpcomingIcon, 
  EventBusy as CancelledIcon,
  Event as OngoingIcon,
  EventNote as CompletedIcon,
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
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)
  const [actionMessage, setActionMessage] = useState("")

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
      setRefreshing(false)
    }
  }

  useEffect(() => {
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

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  const handleDeleteEvent = async () => {
    if (!selectedEventId) return

    try {
      setProcessing(true)
      await api.delete(`/events/${selectedEventId}`)
      
      // Show success message
      setActionMessage(`"${selectedEventTitle}" has been successfully deleted`)
      setActionSuccess(true)
      
      // Close dialog and refresh
      setDeleteDialogOpen(false)
      setSelectedEventId(null)
      fetchEvents()
    } catch (err) {
      console.error("Error deleting event:", err)
      setError("Failed to delete event. Please try again later.")
    } finally {
      setProcessing(false)
    }
  }

  const openDeleteDialog = (id: number, title: string) => {
    setSelectedEventId(id)
    setSelectedEventTitle(title)
    setDeleteDialogOpen(true)
  }

  const handleCloseSnackbar = () => {
    setActionSuccess(false)
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return <UpcomingIcon fontSize="small" />
      case "ongoing":
        return <OngoingIcon fontSize="small" />
      case "completed":
        return <CompletedIcon fontSize="small" />
      case "cancelled":
        return <CancelledIcon fontSize="small" />
      default:
        return <CompletedIcon fontSize="small" />
    }
  }

  // Get unique facilities for filter
  const facilities = [...new Set(events.map((event) => event.facility))]
    .filter((facility): facility is NonNullable<typeof facility> => facility !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Count events by status for stats and filter labels
  const upcomingCount = events.filter(e => e.status === "upcoming").length
  const ongoingCount = events.filter(e => e.status === "ongoing").length
  const completedCount = events.filter(e => e.status === "completed").length
  const cancelledCount = events.filter(e => e.status === "cancelled").length

  const columns: GridColDef[] = [
    { 
      field: "title", 
      headerName: "Event Title", 
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ fontWeight: 'medium' }}>
          {params.value}
        </Box>
      )
    },
    {
      field: "facility",
      headerName: "Facility",
      width: 150,
      valueGetter: (params) => params.row.facility?.name || "Unknown",
    },
    {
      field: "date",
      headerName: "Date",
      width: 200,
      valueGetter: (params) => {
        const startDate = new Date(params.row.start_date).toLocaleDateString();
        const endDate = new Date(params.row.end_date).toLocaleDateString();
        return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      },
    },
    {
      field: "time",
      headerName: "Time",
      width: 150,
      valueGetter: (params) => `${params.row.start_time} - ${params.row.end_time}`,
    },
    {
      field: "attendees",
      headerName: "Attendees",
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const current = params.row.current_attendees;
        const max = params.row.max_attendees;
        const percentage = Math.round((current / max) * 100);
        
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{current}/{max}</Typography>
              <Typography variant="body2" color="text.secondary">{percentage}%</Typography>
            </Box>
            <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 4 }}>
              <Box 
                sx={{ 
                  width: `${percentage}%`, 
                  bgcolor: percentage > 80 ? '#f44336' : '#4caf50', 
                  borderRadius: 1, 
                  height: '100%',
                  minWidth: '5%',
                }}
              />
            </Box>
          </Box>
        );
      }
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value as string) as any} 
          size="small"
          icon={getStatusIcon(params.value as string)}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View event details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/admin/events/${params.row.event_id}`)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Edit event">
            <IconButton
              size="small"
              color="info"
              onClick={() => navigate(`/admin/events/${params.row.event_id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete event">
            <IconButton
              size="small"
              color="error"
              onClick={() => openDeleteDialog(params.row.event_id, params.row.title)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Manage Events
        </Typography>
        <Tooltip title="Create a new event">
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />} 
            onClick={() => navigate("/admin/events/create")}
            sx={{ fontWeight: 'medium' }}
          >
            Create Event
          </Button>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status Cards Summary */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                border: '1px solid #a5d6a7',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '6px', 
                  height: '100%', 
                  bgcolor: '#4caf50' 
                }} 
              />
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                UPCOMING
              </Typography>
              <Typography variant="h3" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                {upcomingCount}
              </Typography>
              <UpcomingIcon 
                sx={{ 
                  position: 'absolute', 
                  right: '12px', 
                  bottom: '12px', 
                  fontSize: '50px', 
                  color: 'rgba(76, 175, 80, 0.15)' 
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                border: '1px solid #ffe082',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '6px', 
                  height: '100%', 
                  bgcolor: '#ff9800' 
                }} 
              />
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                ONGOING
              </Typography>
              <Typography variant="h3" sx={{ color: '#ef6c00', fontWeight: 'bold', mb: 1 }}>
                {ongoingCount}
              </Typography>
              <OngoingIcon 
                sx={{ 
                  position: 'absolute', 
                  right: '12px', 
                  bottom: '12px', 
                  fontSize: '50px', 
                  color: 'rgba(255, 152, 0, 0.15)' 
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                border: '1px solid #90caf9',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '6px', 
                  height: '100%', 
                  bgcolor: '#2196f3' 
                }} 
              />
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                COMPLETED
              </Typography>
              <Typography variant="h3" sx={{ color: '#1565c0', fontWeight: 'bold', mb: 1 }}>
                {completedCount}
              </Typography>
              <CompletedIcon 
                sx={{ 
                  position: 'absolute', 
                  right: '12px', 
                  bottom: '12px', 
                  fontSize: '50px', 
                  color: 'rgba(33, 150, 243, 0.15)' 
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                border: '1px solid #ef9a9a',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '6px', 
                  height: '100%', 
                  bgcolor: '#f44336' 
                }} 
              />
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                CANCELLED
              </Typography>
              <Typography variant="h3" sx={{ color: '#c62828', fontWeight: 'bold', mb: 1 }}>
                {cancelledCount}
              </Typography>
              <CancelledIcon 
                sx={{ 
                  position: 'absolute', 
                  right: '12px', 
                  bottom: '12px', 
                  fontSize: '50px', 
                  color: 'rgba(244, 67, 54, 0.15)' 
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} /> Filters
            </Typography>
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} color="primary" disabled={refreshing}>
                <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search events"
                placeholder="Search by title, description or facility..."
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
                  <MenuItem value="upcoming">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={upcomingCount} color="success" sx={{ mr: 1 }} /> Upcoming
                    </Box>
                  </MenuItem>
                  <MenuItem value="ongoing">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={ongoingCount} color="warning" sx={{ mr: 1 }} /> Ongoing
                    </Box>
                  </MenuItem>
                  <MenuItem value="completed">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={completedCount} color="primary" sx={{ mr: 1 }} /> Completed
                    </Box>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={cancelledCount} color="error" sx={{ mr: 1 }} /> Cancelled
                    </Box>
                  </MenuItem>
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

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredEvents.length} of {events.length} events
            </Typography>
            
            {searchTerm || filterStatus !== "all" || filterFacility !== "all" ? (
              <Button 
                size="small" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterFacility("all");
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      {/* Responsive Grid/Card Layout */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper elevation={2} sx={{ height: 600, width: "100%", p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading events...
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={filteredEvents}
              columns={columns}
              getRowId={(row) => row.event_id}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: 'start_date', sort: 'asc' }],
                },
                columns: {
                  columnVisibilityModel: {
                    actions: true
                  }
                }
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                // Ensure horizontal scrolling works properly
                width: '100%',
                overflowX: 'visible'
              }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                },
              }}
            />
          )}
        </Paper>
      </Box>

      {/* Mobile View - Card Based Layout */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading events...
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredEvents.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>No events match your search criteria</Alert>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.event_id} sx={{ mb: 2, borderRadius: '8px', overflow: 'visible' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {event.title}
                      </Typography>
                      
                      <Chip 
                        label={event.status}
                        color={getStatusColor(event.status) as any}
                        size="small"
                        icon={getStatusIcon(event.status)}
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Facility</Typography>
                        <Typography variant="body1">{event.facility?.name || "Unknown"}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Date</Typography>
                        <Typography variant="body1">
                          {new Date(event.start_date).toLocaleDateString() === new Date(event.end_date).toLocaleDateString() 
                            ? new Date(event.start_date).toLocaleDateString()
                            : `${new Date(event.start_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`
                          }
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Time</Typography>
                        <Typography variant="body1">{event.start_time} - {event.end_time}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Attendees</Typography>
                        <Typography variant="body1">{event.current_attendees}/{event.max_attendees}</Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/admin/events/${event.event_id}`)}
                      >
                        View
                      </Button>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/admin/events/${event.event_id}/edit`)}
                        >
                          Edit
                        </Button>
                        
                        <Button 
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => openDeleteDialog(event.event_id, event.title)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
            
            {/* Mobile Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
              <Button 
                disabled={!(filteredEvents.length > 10)} 
                variant="outlined" 
                size="small"
                sx={{ borderRadius: '20px' }}
              >
                Load More
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the event <strong>"{selectedEventTitle}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteEvent} 
            color="error" 
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={actionSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={actionMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </section>
  )
}

export default ManageEventsPage