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
} from "@mui/material"
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid"
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon } from "@mui/icons-material"
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

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/facilities")
        setFacilities(response.data.data)
        setFilteredFacilities(response.data.data)
      } catch (err) {
        console.error("Error fetching facilities:", err)
        setError("Failed to load facilities. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchFacilities()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = facilities

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (facility) =>
          facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          facility.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (filterType !== "all") {
      result = result.filter((facility) => facility.type === filterType)
    }

    // Filter by status
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

  const handleUpdateStatus = async (facilityId: number, status: string) => {
    try {
      await api.put(`/facilities/${facilityId}`, { status })
      // Refresh facilities
      const response = await api.get("/facilities")
      setFacilities(response.data.data)
    } catch (err) {
      console.error("Error updating facility status:", err)
      setError("Failed to update facility status. Please try again later.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "success"
      case "closed":
        return "error"
      case "maintenance":
        return "warning"
      default:
        return "default"
    }
  }

  const facilityTypes = [...new Set(facilities.map((facility) => facility.type))]

  const columns: GridColDef[] = [
    { field: "facility_id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "type", headerName: "Type", width: 150 },
    { field: "location", headerName: "Location", width: 200 },
    { field: "capacity", headerName: "Capacity", width: 100, type: "number" },
    {
      field: "is_indoor",
      headerName: "Indoor/Outdoor",
      width: 150,
      renderCell: (params: GridRenderCellParams) => <span>{params.value ? "Indoor" : "Outdoor"}</span>,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
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
            startIcon={<EditIcon />}
            onClick={() => navigate(`/admin/facilities/${params.row.facility_id}/edit`)}
          >
            Edit
          </Button>
          {params.row.status !== "open" && (
            <Button size="small" color="success" onClick={() => handleUpdateStatus(params.row.facility_id, "open")}>
              Open
            </Button>
          )}
          {params.row.status !== "maintenance" && (
            <Button
              size="small"
              color="warning"
              onClick={() => handleUpdateStatus(params.row.facility_id, "maintenance")}
            >
              Maintenance
            </Button>
          )}
          {params.row.status !== "closed" && (
            <Button size="small" color="error" onClick={() => handleUpdateStatus(params.row.facility_id, "closed")}>
              Close
            </Button>
          )}
        </Box>
      ),
    },
  ]

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Facilities
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/admin/facilities/create")}>
          Add Facility
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
                label="Search facilities"
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
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select labelId="status-filter-label" value={filterStatus} label="Status" onChange={handleStatusChange}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
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
                rows={filteredFacilities}
                columns={columns}
                getRowId={(row) => row.facility_id}
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
    </section>
  )
}

export default ManageFacilitiesPage
