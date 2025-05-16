"use client"

import React, { useState, useEffect } from "react"
//import { useNavigate } from "react-router-dom"
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
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Snackbar,
} from "@mui/material"
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid"
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  PendingActions as PendingIcon,
  CheckCircleOutline as ApprovedIcon,
  CancelOutlined as RejectedIcon,
  EventBusy as CancelledIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"

interface Booking {
  booking_id: number
  facility_id: number
  resident_id: number
  date: string
  start_time: string
  end_time: string
  status: string
  purpose: string
  attendees: number
  created_at: string
  approved_by: number | null
  approval_date: string | null
  Facility: {
    facility_id: number
    name: string
    type: string
    location: string
  }
  approver: {
    staff_id: number
    employee_id: string
    name: string
  } | null
  resident_name: string | null
}

const ManageBookingsPage = () => {
  //const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterFacility, setFilterFacility] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [processing, setProcessing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)
  const [actionMessage, setActionMessage] = useState("")

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get("/bookings")
      setBookings(response.data.data)
      setFilteredBookings(response.data.data)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      setError("Failed to load bookings. Please try again later.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    let result = bookings
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(booking => {
        const searchStrings = [
          booking.resident_name?.toLowerCase() || '',
          `resident ${booking.resident_id}`.toLowerCase(),
          booking.Facility.name.toLowerCase(),
          booking.purpose.toLowerCase()
        ]
        return searchStrings.some(s => s.includes(lowerSearch))
      })
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter(booking => booking.status === filterStatus)
    }
    
    // Filter by facility
    if (filterFacility !== "all") {
      result = result.filter(booking => booking.Facility.facility_id === Number(filterFacility))
    }
    
    setFilteredBookings(result)
  }, [searchTerm, filterStatus, filterFacility, bookings])

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
    fetchBookings()
  }

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      setProcessing(true)
      await api.put(`/bookings/${bookingId}/status`, { status })
      
      // Show success message
      setActionMessage(`Booking has been successfully ${status === 'approved' ? 'approved' : 'rejected'}`)
      setActionSuccess(true)
      
      // Close dialog and refresh
      setDialogOpen(false)
      setDialogAction(null)
      fetchBookings()
    } catch (err) {
      console.error("Error updating booking status:", err)
      setError("Failed to update booking status. Please try again later.")
    } finally {
      setProcessing(false)
    }
  }

  const openDialog = (id: number, action: string) => {
    setDialogAction({ id, action })
    setDialogOpen(true)
  }

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailModalOpen(true)
  }

  const handleCloseSnackbar = () => {
    setActionSuccess(false)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
        return "error"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <PendingIcon fontSize="small" />
      case "approved":
        return <ApprovedIcon fontSize="small" />
      case "rejected":
        return <RejectedIcon fontSize="small" />
      case "cancelled":
        return <CancelledIcon fontSize="small" />
      default:
        return <PendingIcon fontSize="small" />
    }
  }

  const facilities = Array.from(new Map(
    bookings.map(booking => [booking.Facility.facility_id, booking.Facility])
  ).values()).sort((a, b) => a.name.localeCompare(b.name))

  // Count bookings by status for stats and filter labels
  const pendingCount = bookings.filter(b => b.status === "pending").length
  const approvedCount = bookings.filter(b => b.status === "approved").length
  const rejectedCount = bookings.filter(b => b.status === "rejected").length
  const cancelledCount = bookings.filter(b => b.status === "cancelled").length

  const columns: GridColDef[] = [
    { 
      field: "booking_id", 
      headerName: "ID", 
      width: 70 
    },
    {
      field: "user",
      headerName: "User",
      width: 200,
      valueGetter: (params) => {
        if (params.row.resident_name) return params.row.resident_name
        return `Resident ${params.row.resident_id || 'Unknown'}`
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ fontWeight: 'medium' }}>
          {params.value}
        </Box>
      )
    },
    {
      field: "facility",
      headerName: "Facility",
      width: 180,
      valueGetter: (params) => params.row.Facility.name,
    },
    {
      field: "date",
      headerName: "Date",
      width: 120,
      valueGetter: (params) => new Date(params.row.date).toLocaleDateString(),
    },
    {
      field: "time",
      headerName: "Time",
      width: 150,
      valueGetter: (params) => `${params.row.start_time} - ${params.row.end_time}`,
    },
    { 
      field: "purpose", 
      headerName: "Purpose", 
      width: 200 
    },
    { 
      field: "attendees", 
      headerName: "Attendees", 
      width: 100, 
      type: "number" 
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
      field: "created_at",
      headerName: "Created",
      width: 120,
      valueGetter: (params) => new Date(params.row.created_at).toLocaleDateString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View booking details">
            <IconButton
              size="small"
              color="primary"
              onClick={() => openDetailsModal(params.row)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {(params.row.status === "pending" || params.row.status === "rejected") && (
            <Tooltip title="Approve booking">
              <IconButton
                size="small"
                color="success"
                onClick={() => openDialog(params.row.booking_id, "approve")}
              >
                <ApproveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {(params.row.status === "pending" || params.row.status === "approved") && (
            <Tooltip title="Reject booking">
              <IconButton
                size="small"
                color="error"
                onClick={() => openDialog(params.row.booking_id, "reject")}
              >
                <RejectIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Manage Bookings
        </Typography>
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
                PENDING
              </Typography>
              <Typography variant="h3" sx={{ color: '#ef6c00', fontWeight: 'bold', mb: 1 }}>
                {pendingCount}
              </Typography>
              <PendingIcon 
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
                APPROVED
              </Typography>
              <Typography variant="h3" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                {approvedCount}
              </Typography>
              <ApprovedIcon 
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
                REJECTED
              </Typography>
              <Typography variant="h3" sx={{ color: '#c62828', fontWeight: 'bold', mb: 1 }}>
                {rejectedCount}
              </Typography>
              <RejectedIcon 
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
                CANCELLED
              </Typography>
              <Typography variant="h3" sx={{ color: '#1565c0', fontWeight: 'bold', mb: 1 }}>
                {cancelledCount}
              </Typography>
              <CancelledIcon 
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
                label="Search bookings"
                placeholder="Search by user, facility or purpose..."
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
                <Select 
                  labelId="status-filter-label" 
                  value={filterStatus} 
                  label="Status" 
                  onChange={handleStatusChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={pendingCount} color="warning" sx={{ mr: 1 }} /> Pending
                    </Box>
                  </MenuItem>
                  <MenuItem value="approved">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={approvedCount} color="success" sx={{ mr: 1 }} /> Approved
                    </Box>
                  </MenuItem>
                  <MenuItem value="rejected">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={rejectedCount} color="error" sx={{ mr: 1 }} /> Rejected
                    </Box>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={cancelledCount} color="primary" sx={{ mr: 1 }} /> Cancelled
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
              Showing {filteredBookings.length} of {bookings.length} bookings
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
                Loading bookings...
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={filteredBookings}
              columns={columns}
              getRowId={(row) => row.booking_id}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: 'date', sort: 'asc' }],
                },
                columns: {
                  columnVisibilityModel: {
                    actions: true
                  }
                }
              }}
              pageSizeOptions={[10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
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
              Loading bookings...
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredBookings.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>No bookings match your search criteria</Alert>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.booking_id} sx={{ mb: 2, borderRadius: '8px', overflow: 'visible' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {booking.resident_name || `Resident ${booking.resident_id}`}
                      </Typography>
                      
                      <Chip 
                        label={booking.status}
                        color={getStatusColor(booking.status) as any}
                        size="small"
                        icon={getStatusIcon(booking.status)}
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Facility</Typography>
                        <Typography variant="body1">{booking.Facility.name}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Date</Typography>
                        <Typography variant="body1">
                          {new Date(booking.date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Time</Typography>
                        <Typography variant="body1">{booking.start_time} - {booking.end_time}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Attendees</Typography>
                        <Typography variant="body1">{booking.attendees}</Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Purpose</Typography>
                        <Typography variant="body1" noWrap>{booking.purpose}</Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => openDetailsModal(booking)}
                      >
                        View
                      </Button>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {(booking.status === "pending" || booking.status === "rejected") && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => openDialog(booking.booking_id, "approve")}
                          >
                            Approve
                          </Button>
                        )}
                        
                        {(booking.status === "pending" || booking.status === "approved") && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => openDialog(booking.booking_id, "reject")}
                          >
                            Reject
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
            
            {/* Mobile Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
              <Button 
                disabled={!(filteredBookings.length > 10)} 
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

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogAction?.action === "approve" ? "Approve Booking" : "Reject Booking"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction?.action === "approve"
              ? "Are you sure you want to approve this booking? This will confirm the facility reservation."
              : "Are you sure you want to reject this booking? The user will be notified and the slot will become available again."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={() =>
              dialogAction &&
              handleUpdateStatus(dialogAction.id, dialogAction.action === "approve" ? "approved" : "rejected")
            }
            color={dialogAction?.action === "approve" ? "success" : "error"}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} /> : 
              dialogAction?.action === "approve" ? <ApproveIcon /> : <RejectIcon />}
          >
            {dialogAction?.action === "approve" ? "Approve" : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', pb: 2 }}>
          Booking Details
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedBooking && (
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Facility</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">{selectedBooking.Facility.name}</Typography>
                  </Grid>
                </Grid>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">User</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedBooking.resident_name || `Resident ${selectedBooking.resident_id}`}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                   <Typography variant="body2" color="text.secondary">Date</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {new Date(selectedBooking.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Time</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {selectedBooking.start_time} - {selectedBooking.end_time}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Purpose</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {selectedBooking.purpose}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Attendees</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {selectedBooking.attendees}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Chip
                      label={selectedBooking.status}
                      color={getStatusColor(selectedBooking.status) as any}
                      size="small"
                      icon={getStatusIcon(selectedBooking.status)}
                    />
                  </Grid>
                </Grid>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Grid container>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Created</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {new Date(selectedBooking.created_at).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
              
              {(selectedBooking.status === "approved" || selectedBooking.status === "rejected") && (
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Grid container>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Processed By</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body1">
                        {selectedBooking.approver ? 
                        `${selectedBooking.approver.name} (${selectedBooking.approver.employee_id})` : 
                        "Unknown"}
                      </Typography>
                    </Grid>
                  </Grid>
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)', px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>
          {selectedBooking && selectedBooking.status === "pending" && (
            <>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<ApproveIcon />}
                onClick={() => {
                  setDetailModalOpen(false);
                  openDialog(selectedBooking.booking_id, "approve");
                }}
              >
                Approve
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<RejectIcon />}
                onClick={() => {
                  setDetailModalOpen(false);
                  openDialog(selectedBooking.booking_id, "reject");
                }}
              >
                Reject
              </Button>
            </>
          )}
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

export default ManageBookingsPage 