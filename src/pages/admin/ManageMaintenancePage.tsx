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
  Visibility as ViewIcon,
  Build as BuildIcon,
  CheckCircle as CompleteIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"

interface MaintenanceReport {
  report_id: number
  title: string
  description: string
  facility: {
    name: string
    facility_id: number
  }
  user: {
    name: string
    user_id: number
  }
  reported_date: string
  status: string
  priority: string
}

const ManageMaintenancePage = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState<MaintenanceReport[]>([])
  const [filteredReports, setFilteredReports] = useState<MaintenanceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterFacility, setFilterFacility] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<{ id: number; status: string } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchMaintenanceReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/maintenance")
        setReports(response.data.data)
        setFilteredReports(response.data.data)
      } catch (err) {
        console.error("Error fetching maintenance reports:", err)
        setError("Failed to load maintenance reports. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchMaintenanceReports()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = reports

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (report) =>
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.facility?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.user?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((report) => report.status === filterStatus)
    }

    // Filter by priority
    if (filterPriority !== "all") {
      result = result.filter((report) => report.priority === filterPriority)
    }

    // Filter by facility
    if (filterFacility !== "all") {
      result = result.filter((report) => report.facility?.facility_id === Number(filterFacility))
    }

    setFilteredReports(result)
  }, [searchTerm, filterStatus, filterPriority, filterFacility, reports])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleStatusChange = (event: any) => {
    setFilterStatus(event.target.value)
  }

  const handlePriorityChange = (event: any) => {
    setFilterPriority(event.target.value)
  }

  const handleFacilityChange = (event: any) => {
    setFilterFacility(event.target.value)
  }

  const handleUpdateStatus = async (reportId: number, status: string) => {
    try {
      setProcessing(true)
      await api.put(`/maintenance/${reportId}/status`, { status })
      // Refresh reports
      const response = await api.get("/maintenance")
      setReports(response.data.data)
      setDialogOpen(false)
      setDialogAction(null)
    } catch (err) {
      console.error("Error updating maintenance status:", err)
      setError("Failed to update maintenance status. Please try again later.")
    } finally {
      setProcessing(false)
    }
  }

  const openDialog = (id: number, status: string) => {
    setDialogAction({ id, status })
    setDialogOpen(true)
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

  // Get unique facilities for filter
  const facilities = [...new Set(reports.map((report) => report.facility))]
    .filter((facility): facility is NonNullable<typeof facility> => facility !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))

  const columns: GridColDef[] = [
    { field: "report_id", headerName: "ID", width: 70 },
    { field: "title", headerName: "Title", width: 200 },
    {
      field: "user",
      headerName: "Reported By",
      width: 150,
      valueGetter: (params) => params.row.user?.name || "Unknown",
    },
    {
      field: "facility",
      headerName: "Facility",
      width: 150,
      valueGetter: (params) => params.row.facility?.name || "Unknown",
    },
    {
      field: "reported_date",
      headerName: "Reported Date",
      width: 120,
      valueGetter: (params) => new Date(params.row.reported_date).toLocaleDateString(),
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} color={getPriorityColor(params.value as string) as any} size="small" />
      ),
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
      width: 350,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => navigate(`/admin/maintenance/${params.row.report_id}`)}
          >
            View
          </Button>
          {params.row.status === "reported" && (
            <Button
              size="small"
              color="warning"
              startIcon={<BuildIcon />}
              onClick={() => openDialog(params.row.report_id, "in-progress")}
            >
              Start Work
            </Button>
          )}
          {params.row.status === "in-progress" && (
            <Button
              size="small"
              color="info"
              startIcon={<BuildIcon />}
              onClick={() => openDialog(params.row.report_id, "scheduled")}
            >
              Schedule
            </Button>
          )}
          {(params.row.status === "in-progress" || params.row.status === "scheduled") && (
            <Button
              size="small"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={() => openDialog(params.row.report_id, "completed")}
            >
              Complete
            </Button>
          )}
        </Box>
      ),
    },
  ]

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Maintenance
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
                label="Search maintenance reports"
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
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" value={filterStatus} label="Status" onChange={handleStatusChange}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="reported">Reported</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth>
                <InputLabel id="priority-filter-label">Priority</InputLabel>
                <Select
                  labelId="priority-filter-label"
                  value={filterPriority}
                  label="Priority"
                  onChange={handlePriorityChange}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
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
                rows={filteredReports}
                columns={columns}
                getRowId={(row) => row.report_id}
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

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Update Maintenance Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction?.status === "in-progress" && "Are you sure you want to start work on this maintenance issue?"}
            {dialogAction?.status === "scheduled" && "Are you sure you want to mark this issue as scheduled?"}
            {dialogAction?.status === "completed" && "Are you sure you want to mark this issue as completed?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={() => dialogAction && handleUpdateStatus(dialogAction.id, dialogAction.status)}
            color={dialogAction?.status === "completed" ? "success" : "primary"}
            disabled={processing}
          >
            Confirm
            {processing && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  )
}

export default ManageMaintenancePage
