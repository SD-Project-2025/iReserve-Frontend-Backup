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
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Snackbar
} from "@mui/material"
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid"
import {
  Add as AddIcon, 
  Search as SearchIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as OpenIcon,
  BuildOutlined as MaintenanceIcon,
  CancelOutlined as CloseIcon
} from "@mui/icons-material"
import { api } from "@/services/api"

interface Facility {
  facility_id: number
  name: string
  type: string
  location: string
  capacity: number
  is_indoor: boolean
  status: string
  open_time: string
  close_time: string
}

const ManageFacilitiesPage = () => {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [refreshing, setRefreshing] = useState(false)
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [noAssignedFacilities, setNoAssignedFacilities] = useState(false)

  const fetchFacilities = async () => {
    try {
      setLoading(true)
      setError(null)
      setNoAssignedFacilities(false)
      
      const userProfile = await api.get("/auth/me")
      const staffId = userProfile.data.data.profile.staff_id
      
      if (staffId && userProfile.data.data.profile.is_admin === false) {
        try {
          const response = await api.get(`/facilities/staff/${staffId}`)
          setFacilities(response.data)
          setFilteredFacilities(response.data)
        } catch (err: any) {
          if (err.response?.status === 404) {
            setNoAssignedFacilities(true)
            setFacilities([])
            setFilteredFacilities([])
          } else {
            throw err
          }
        }
      } else {
        const response = await api.get(`/facilities`)
        setFacilities(response.data.data)
        setFilteredFacilities(response.data.data)
      }
    } catch (err: any) {
      console.error("Error fetching facilities:", err)
      setError(
        err.response?.status === 404 
          ? "No facilities found." 
          : "Failed to load facilities. Please try again later."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchFacilities()
  }, [])

  useEffect(() => {
    let result = facilities

    if (searchTerm) {
      result = result.filter(
        (facility) =>
          facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          facility.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterType !== "all") {
      result = result.filter((facility) => facility.type === filterType)
    }

    if (filterStatus !== "all") {
      result = result.filter((facility) => facility.status === filterStatus)
    }

    setFilteredFacilities(result)
  }, [searchTerm, filterType, filterStatus, facilities])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleTypeChange = (event: any) => {
    setFilterType(event.target.value)
  }

  const handleStatusChange = (event: any) => {
    setFilterStatus(event.target.value)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchFacilities()
  }

  const handleUpdateStatus = async (facilityId: number, status: string, facilityName: string) => {
    try {
      await api.put(`/facilities/${facilityId}`, { status })
      
      let action = "opened"
      if (status === "maintenance") action = "placed under maintenance"
      if (status === "closed") action = "closed"
      
      setStatusMessage(`"${facilityName}" successfully ${action}`)
      setStatusUpdateSuccess(true)
      fetchFacilities()
    } catch (err) {
      console.error("Error updating facility status:", err)
      setError("Failed to update facility status. Please try again later.")
    }
  }

  const handleCloseSnackbar = () => {
    setStatusUpdateSuccess(false)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open": return "success"
      case "closed": return "error"
      case "maintenance": return "warning"
      default: return "default"
    }
  }

  const facilityTypes = [...new Set(facilities.map((facility) => facility.type))]

  // Stats calculation
  const openCount = facilities.filter(f => f.status === "open").length
  const maintenanceCount = facilities.filter(f => f.status === "maintenance").length
  const closedCount = facilities.filter(f => f.status === "closed").length

  const columns: GridColDef[] = [
    { 
      field: "name", 
      headerName: "Facility Name", 
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ fontWeight: 'medium' }}>{params.value}</Box>
      ) 
    },
    { field: "type", headerName: "Type", width: 150 },
    { field: "location", headerName: "Location", width: 200 },
    { 
      field: "capacity", 
      headerName: "Capacity", 
      width: 120, 
      type: "number",
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ textAlign: 'center', width: '100%' }}>{params.value}</Box>
      )
    },
    {
      field: "is_indoor",
      headerName: "Indoor/Outdoor",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value ? "Indoor" : "Outdoor"} 
          color={params.value ? "primary" : "default"} 
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value as string) as any} 
          size="small"
          icon={
            params.value === "open" ? <OpenIcon fontSize="small" /> : 
            params.value === "maintenance" ? <MaintenanceIcon fontSize="small" /> : 
            <CloseIcon fontSize="small" />
          }
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.row.status;
        return (
          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 1 }}>
            <Tooltip title="Edit facility details">
              <Button
                size="small"
                variant="outlined"
                color="primary"
                sx={{ minWidth: 'auto', px: 1.5 }}
                onClick={() => navigate(`/admin/facilities/${params.row.facility_id}/edit`)}
              >
                <EditIcon fontSize="small" />
              </Button>
            </Tooltip>

            <Box sx={{ display: "flex", bgcolor: "background.paper", borderRadius: "4px", border: "1px solid rgba(0, 0, 0, 0.12)", overflow: "hidden" }}>
              {status !== "open" && (
                <Tooltip title="Set as Open">
                  <IconButton 
                    size="small"
                    color="success"
                    onClick={() => handleUpdateStatus(params.row.facility_id, "open", params.row.name)}
                    sx={{ p: 0.5, borderRadius: 0 }}
                  >
                    <OpenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {status !== "maintenance" && (
                <Tooltip title="Set to Maintenance">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => handleUpdateStatus(params.row.facility_id, "maintenance", params.row.name)}
                    sx={{ p: 0.5, borderRadius: 0 }}
                  >
                    <MaintenanceIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              
              {status !== "closed" && (
                <Tooltip title="Close Facility">
                  <IconButton 
                    size="small"
                    color="error"
                    onClick={() => handleUpdateStatus(params.row.facility_id, "closed", params.row.name)}
                    sx={{ p: 0.5, borderRadius: 0 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )
      },
    },
  ]

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Manage Facilities
        </Typography>
        <Tooltip title="Add a new facility">
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />} 
            onClick={() => navigate("/admin/facilities/create")}
            sx={{ fontWeight: 'medium' }}
          >
            Add Facility
          </Button>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {noAssignedFacilities && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You currently have no facilities assigned to you. Please contact your administrator.
        </Alert>
      )}

      {/* Status Cards Summary - Only show if there are facilities */}
      {facilities.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: '8px', background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', border: '1px solid #a5d6a7' }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>OPEN FACILITIES</Typography>
                <Typography variant="h3" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>{openCount}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: `${Math.round((openCount / facilities.length) * 100) || 0}%`, height: '6px', bgcolor: '#4caf50', borderRadius: '3px', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    {Math.round((openCount / facilities.length) * 100) || 0}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: '8px', background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)', border: '1px solid #ffe082' }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>UNDER MAINTENANCE</Typography>
                <Typography variant="h3" sx={{ color: '#ef6c00', fontWeight: 'bold', mb: 1 }}>{maintenanceCount}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: `${Math.round((maintenanceCount / facilities.length) * 100) || 0}%`, height: '6px', bgcolor: '#ff9800', borderRadius: '3px', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#ef6c00', fontWeight: 'bold' }}>
                    {Math.round((maintenanceCount / facilities.length) * 100) || 0}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: '8px', background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', border: '1px solid #ef9a9a' }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>CLOSED FACILITIES</Typography>
                <Typography variant="h3" sx={{ color: '#c62828', fontWeight: 'bold', mb: 1 }}>{closedCount}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: `${Math.round((closedCount / facilities.length) * 100) || 0}%`, height: '6px', bgcolor: '#f44336', borderRadius: '3px', mr: 1 }} />
                  <Typography variant="body2" sx={{ color: '#c62828', fontWeight: 'bold' }}>
                    {Math.round((closedCount / facilities.length) * 100) || 0}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

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
                label="Search facilities"
                placeholder="Search by name or location..."
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
                <InputLabel id="type-filter-label">Type</InputLabel>
                <Select labelId="type-filter-label" value={filterType} label="Type" onChange={handleTypeChange}>
                  <MenuItem value="all">All Types</MenuItem>
                  {facilityTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" value={filterStatus} label="Status" onChange={handleStatusChange}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="open">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={openCount} color="success" sx={{ mr: 1 }} /> Open
                    </Box>
                  </MenuItem>
                  <MenuItem value="maintenance">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={maintenanceCount} color="warning" sx={{ mr: 1 }} /> Maintenance
                    </Box>
                  </MenuItem>
                  <MenuItem value="closed">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip size="small" label={closedCount} color="error" sx={{ mr: 1 }} /> Closed
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {facilities.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredFacilities.length} of {facilities.length} facilities
              </Typography>
              
              {(searchTerm || filterType !== "all" || filterStatus !== "all") && (
                <Button 
                  size="small" 
                  onClick={() => {
                    setSearchTerm("")
                    setFilterType("all")
                    setFilterStatus("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Paper elevation={2} sx={{ height: 600, width: "100%", p: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Loading facilities...</Typography>
          </Box>
        ) : noAssignedFacilities ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>No Facilities Assigned</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              You currently don't have any facilities assigned to your account.
            </Typography>
            <Button variant="outlined" onClick={handleRefresh}>
              <RefreshIcon sx={{ mr: 1 }} /> Refresh
            </Button>
          </Box>
        ) : facilities.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>No Facilities Found</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              There are currently no facilities available in the system.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/admin/facilities/create")}>
              <AddIcon sx={{ mr: 1 }} /> Create New Facility
            </Button>
          </Box>
        ) : (
          <DataGrid
            rows={filteredFacilities}
            columns={columns}
            getRowId={(row) => row.facility_id}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
              sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
            }}
          />
        )}
      </Paper>

      <Snackbar
        open={statusUpdateSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={statusMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error}
      />
    </section>
  )
}

export default ManageFacilitiesPage