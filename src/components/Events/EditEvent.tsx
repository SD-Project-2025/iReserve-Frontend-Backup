"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate,useLocation } from "react-router-dom"
import { format } from 'date-fns'; // Updated imports
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  
  Grid,
  Alert,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"

import {
  
  
  Group as GroupIcon,
  MonetizationOn as FeeIcon,
  Public as PublicIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"
 

interface Facility {
  facility_id: number
  name: string
}

 

const EditEvent = () => {
  
  const location = useLocation()
  const id = location.state?.id || useParams<{ id: string }>().id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
 

  const [event, setEvent] = useState({
    event_id: 0,
    title: "",
    description: "",
    facility_id: 0,
    start_date: new Date(),
    end_date: new Date(),
    start_time: "00:00",
    end_time: "00:00",
    organizer_staff_id: 0,
    status: "upcoming",
    capacity: 0,
    image_url: "",
    is_public: true,
    registration_deadline: new Date(),
    fee: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch event data
        const eventResponse = await api.get(`/events/${id}`)
        const eventData = eventResponse.data.data
        
        // Convert string dates to Date objects
        const formattedEvent = {
          ...eventData,
          start_date: new Date(eventData.start_date),
          end_date: new Date(eventData.end_date),
          registration_deadline: new Date(eventData.registration_deadline),
        }
        
        setEvent(formattedEvent)
        
        // Fetch facilities and staff for dropdowns
        const [facilitiesResponse] = await Promise.all([
          api.get('/facilities'),
         
        ])
        
        setFacilities(facilitiesResponse.data.data)
       
        
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load event data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setEvent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDateChange = (name: string) => (date: Date | null) => {
    if (date) {
      setEvent(prev => ({ ...prev, [name]: date }))
    }
  }

  const handleTimeChange = (name: string) => (time: string | null) => {
    if (time) {
      setEvent(prev => ({ ...prev, [name]: time }))
    }
  }

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target
    setEvent(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      // Format dates properly for API
      const payload = {
        ...event,
        start_date: format(event.start_date, 'yyyy-MM-dd'),
        end_date: format(event.end_date, 'yyyy-MM-dd'),
        registration_deadline: format(event.registration_deadline, 'yyyy-MM-dd'),
      };

       await api.put(`/events/${id}`, payload);
      navigate(`/events/${id}`, { state: { message: "Event updated!" } });
    } catch (err) {
      console.error("Update error:", err);
      
    } finally {
      setSaving(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "primary"
      case "ongoing": return "warning"
      case "completed": return "success"
      case "cancelled": return "error"
      default: return "default"
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4">Edit Event</Typography>
          <Chip
            label={event.status}
            color={getStatusColor(event.status)}
            sx={{ textTransform: "capitalize" }}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Event Title"
                      name="title"
                      value={event.title}
                      onChange={handleChange}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={event.description}
                      onChange={handleChange}
                      multiline
                      rows={4}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Image URL"
                      name="image_url"
                      value={event.image_url}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Date & Time
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Start Date"
                      value={event.start_date}
                      onChange={handleDateChange("start_date")}
                      slots={{
                        textField: (params) => <TextField {...params} fullWidth required />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TimePicker
                      label="Start Time"
                      value={event.start_time}
                      onChange={handleTimeChange("start_time")}
                      slots={{
                        textField: (params) => <TextField {...params} fullWidth required />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="End Date"
                      value={event.end_date}
                      onChange={handleDateChange("end_date")}
                      minDate={event.start_date}
                      slots={{
                        textField: (params) => <TextField {...params} fullWidth required />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TimePicker
                      label="End Time"
                      value={event.end_time}
                      onChange={handleTimeChange("end_time")}
                      slots={{
                        textField: (params) => <TextField {...params} fullWidth required />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DatePicker
                      label="Registration Deadline"
                      value={event.registration_deadline}
                      onChange={handleDateChange("registration_deadline")}
                      slots={{
                        textField: (params) => <TextField {...params} fullWidth required />
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Facility</InputLabel>
                      <Select
                        name="facility_id"
                        value={event.facility_id}
                        onChange={handleSelectChange}
                        label="Facility"
                        required
                      >
                        {facilities.map((facility) => (
                          <MenuItem key={facility.facility_id} value={facility.facility_id}>
                            {facility.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                   

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={event.status}
                        onChange={handleSelectChange}
                        label="Status"
                        required
                      >
                        <MenuItem value="upcoming">Upcoming</MenuItem>
                        <MenuItem value="ongoing">Ongoing</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Capacity"
                      name="capacity"
                      type="number"
                      value={event.capacity}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <GroupIcon />
                          </InputAdornment>
                        ),
                        inputProps: { min: 0 }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Fee"
                      name="fee"
                      type="number"
                      value={event.fee}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FeeIcon />
                          </InputAdornment>
                        ),
                        inputProps: { min: 0, step: 0.01 }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="is_public"
                          checked={event.is_public}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <PublicIcon sx={{ mr: 1 }} />
                          Public Event
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<SaveIcon />}
                fullWidth
                disabled={saving}
              >
                Save Changes
                {saving && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                fullWidth
                onClick={() => navigate(`/events/${id}`)}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  )
}

export default EditEvent