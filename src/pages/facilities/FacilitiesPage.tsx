"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Box,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Search as SearchIcon } from "@mui/icons-material"
import { api } from "@/services/api"

interface Facility {
  facility_id: number
  name: string
  type: string
  location: string
  capacity: number
  is_indoor: boolean
  image_url: string
  status: string
  description: string
  average_rating?: number | null
}

const FacilitiesPage = () => {
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
        const facilitiesData: Facility[] = response.data.data
  
        // Fetch ratings for each facility
        const facilitiesWithRatings = await Promise.all(
          facilitiesData.map(async (facility) => {
            try {
              const ratingsRes = await api.get(`/facility-ratings/facility/${facility.facility_id}`)
              const ratings = ratingsRes.data.data || []
              const average =
                ratings.length > 0
                  ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
                  : null
              return { ...facility, average_rating: average }
            } catch (err) {
              console.warn(`Could not fetch ratings for facility ${facility.facility_id}`)
              return { ...facility, average_rating: null }
            }
          })
        )
  
        setFacilities(facilitiesWithRatings)
        setFilteredFacilities(facilitiesWithRatings)
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
          facility.description.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const handleTypeChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value)
  }

  const handleStatusChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value)
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

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Facilities
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredFacilities.length > 0 ? (
        <Grid container spacing={3}>
          {filteredFacilities.map((facility) => (
            <Grid item xs={12} sm={6} md={4} key={facility.facility_id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/facilities/${facility.facility_id}`)}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={facility.image_url || "/placeholder.svg?height=140&width=300"}
                    alt={facility.name}
                  />
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {facility.name}
                      </Typography>
                      <Chip label={facility.status} size="small" color={getStatusColor(facility.status) as any} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {facility.type} • {facility.is_indoor ? "Indoor" : "Outdoor"} • Capacity: {facility.capacity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {facility.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {facility.description.length > 100
                        ? `${facility.description.substring(0, 100)}...`
                        : facility.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {facility.average_rating !== null && facility.average_rating !== undefined
                      ? `Rating: ${facility.average_rating.toFixed(1)} ★`
                      : "No ratings yet"}
                  </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>No facilities found matching your criteria.</Typography>
      )}
    </section>
  )
}

export default FacilitiesPage
