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
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
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
  Resident: {
    resident_id: number
  }
  approver: {
    staff_id: number
    employee_id: string
  } | null
}

const ManageBookingsPage = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterFacility, setFilterFacility] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<{ id: number; action: string } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
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
      }
    }

    fetchBookings()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = bookings

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (booking) =>
          `Resident ${booking.Resident?.resident_id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.Facility?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.purpose.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((booking) => booking.status === filterStatus)
    }

    // Filter by facility
    if (filterFacility !== "all") {
      result = result.filter((booking) => booking.Facility?.facility_id === Number(filterFacility))
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

  const handleUpdateStatus = async (bookingId: number, status: string) => {
    try {
      setProcessing(true)
      await api.put(`/bookings/${bookingId}/status`, { status })
      // Refresh bookings
      const response = await api.get("/bookings")
      setBookings(response.data.data)
      setDialogOpen(false)
      setDialogAction(null)
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  // Get unique facilities for filter
  const facilities = [...new Set(bookings.map((booking) => booking.Facility))]
    .filter((facility): facility is NonNullable<typeof facility> => facility !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

  const columns: GridColDef[] = [
    { field: "booking_id", headerName: "ID", width: 70 },
    {
      field: "user",
      headerName: "User",
      width: 150,
      valueGetter: (params) => `Resident ${params.row.Resident?.resident_id}` || "Unknown",
    },
    {
      field: "facility",
      headerName: "Facility",
      width: 150,
      valueGetter: (params) => params.row.Facility?.name || "Unknown",
    },
    {
      field: "date",
      headerName: "Date",
      width: 120,
      valueGetter: (params) => new Date(params.row.date).toLocaleDateString(),
    },
    { field: "start_time", headerName: "Start", width: 80 },
    { field: "end_time", headerName: "End", width: 80 },
    { field: "purpose", headerName: "Purpose", width: 200 },
    { field: "attendees", headerName: "Attendees", width: 100, type: "number" },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getStatusColor(params.value as string) as any} size="small" />
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
      width: 300,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => navigate(`/admin/bookings/${params.row.booking_id}`)}
          >
            View
          </Button>
          {(params.row.status === "pending" || params.row.status === "rejected") && (
            <Button
              size="small"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => openDialog(params.row.booking_id, "approve")}
            >
              Approve
            </Button>
          )}
          {(params.row.status === "pending" || params.row.status === "approved") && (
            <Button
              size="small"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => openDialog(params.row.booking_id, "reject")}
            >
              Reject
            </Button>
          )}
        </Box>
      ),
    },
  ]

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Bookings
      </Typography>

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
                label="Search bookings"
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
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
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
                rows={filteredBookings}
                columns={columns}
                getRowId={(row) => row.booking_id}
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

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{dialogAction?.action === "approve" ? "Approve Booking" : "Reject Booking"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction?.action === "approve"
              ? "Are you sure you want to approve this booking?"
              : "Are you sure you want to reject this booking?"}
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
          >
            {dialogAction?.action === "approve" ? "Approve" : "Reject"}
            {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default ManageBookingsPage