"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Container,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import {
  Today as DateIcon,
  Schedule as TimeIcon,
  MeetingRoom as FacilityIcon,
  Description as PurposeIcon,
  People as AttendeesIcon,
  Notes as NotesIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"

interface Facility {
  facility_id: number
  name: string
  type: string
  status: string
}

const CreateBookingPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeStep, setActiveStep] = useState(0)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Date configuration
  const today = new Date()
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(today.getDate() + 2)
  dayAfterTomorrow.setHours(0, 0, 0, 0)

  const [formData, setFormData] = useState({
    facility_id: location.state?.facilityId || "",
    date: null as Date | null,
    start_time: null as Date | null,
    end_time: null as Date | null,
    purpose: "",
    attendees: "",
    notes: "",
  })

  const [formErrors, setFormErrors] = useState({
    facility_id: "",
    date: "",
    start_time: "",
    end_time: "",
    purpose: "",
    attendees: "",
    notes: "",
  })

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get("/facilities")
        const openFacilities = response.data.data.filter(
          (facility: Facility) => facility.status === "open"
        )
        setFacilities(openFacilities)
      } catch (err) {
        console.error("Error fetching facilities:", err)
        setError("Failed to load facilities. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchFacilities()
  }, [])

  const validateStep = () => {
    let isValid = true
    const errors = {
      facility_id: "",
      date: "",
      start_time: "",
      end_time: "",
      purpose: "",
      attendees: "",
      notes: "",
    }

    if (activeStep === 0) {
      if (!formData.facility_id) {
        errors.facility_id = "Please select a facility"
        isValid = false
      }
      if (!formData.date) {
        errors.date = "Please select a date"
        isValid = false
      }
      if (!formData.start_time) {
        errors.start_time = "Please select a start time"
        isValid = false
      }
      if (!formData.end_time) {
        errors.end_time = "Please select an end time"
        isValid = false
      } else if (formData.start_time && formData.end_time && 
                 formData.start_time >= formData.end_time) {
        errors.end_time = "End time must be after start time"
        isValid = false
      }
    } else if (activeStep === 1) {
      if (formData.purpose.trim().length < 10) {
        errors.purpose = "Purpose must contain at least 10 characters"
        isValid = false
      }
      if (!formData.attendees) {
        errors.attendees = "Please enter the number of attendees"
        isValid = false
      } else if (isNaN(Number(formData.attendees)) || 
                 Number(formData.attendees) <= 0) {
        errors.attendees = "Please enter a valid number of attendees"
        isValid = false
      }
      if (formData.notes.length > 0 && formData.notes.trim().length < 10) {
        errors.notes = "Notes must contain at least 10 characters if provided"
        isValid = false
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    try {
      setSubmitting(true)
      setError(null)

      const bookingData = {
        facility_id: formData.facility_id,
        date: formData.date?.toISOString().split("T")[0],
        start_time: formData.start_time
          ? `${formData.start_time.getHours().toString().padStart(2, "0")}:${formData.start_time
              .getMinutes()
              .toString()
              .padStart(2, "0")}`
          : null,
        end_time: formData.end_time
          ? `${formData.end_time.getHours().toString().padStart(2, "0")}:${formData.end_time
              .getMinutes()
              .toString()
              .padStart(2, "0")}`
          : null,
        purpose: formData.purpose,
        attendees: Number(formData.attendees),
        notes: formData.notes,
      }

      await api.post("/bookings", bookingData)
      navigate("/bookings")
      await api.post("/notifications", {
        title: "Booking Created",
        message: `You have successfully made a booking ${formData?.purpose}.`,
        type: "booking",
        related_id: formData?.facility_id,
        related_type: "booking",
      })
    } catch (err: any) {
      console.error("Error creating booking:", err)
      setError(err.response?.data?.message || "Failed to create booking. Please try again later.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const steps = ["Select Facility & Time", "Booking Details", "Review & Submit"]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Create New Booking
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Reserve facilities for your upcoming events and meetings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card elevation={3} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4, px: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!formErrors.facility_id}>
                      <InputLabel id="facility-label">Select Facility</InputLabel>
                      <Select
                        labelId="facility-label"
                        value={formData.facility_id}
                        label="Select Facility"
                        onChange={(e) => handleChange("facility_id", e.target.value)}
                        sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center' } }}
                      >
                        {facilities.map((facility) => (
                          <MenuItem key={facility.facility_id} value={facility.facility_id}>
                            <Avatar sx={{ 
                              bgcolor: theme.palette.primary.main,
                              mr: 2,
                              width: 32,
                              height: 32
                            }}>
                              <FacilityIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body1">{facility.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {facility.type}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.facility_id && (
                        <FormHelperText sx={{ ml: 1 }}>{formErrors.facility_id}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Select Date"
                      value={formData.date}
                      onChange={(date) => handleChange("date", date)}
                      minDate={dayAfterTomorrow}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.date,
                          helperText: formErrors.date,
                          InputProps: {
                            startAdornment: <DateIcon color="action" sx={{ mr: 1 }} />,
                          },
                        },
                      }}
                      sx={{ mb: 2 }}
                    />
                    
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2,
                      flexDirection: { xs: 'column', sm: 'row' }
                    }}>
                      <TimePicker
                        label="Start Time"
                        value={formData.start_time}
                        onChange={(time) => handleChange("start_time", time)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!formErrors.start_time,
                            helperText: formErrors.start_time,
                            InputProps: {
                              startAdornment: <TimeIcon color="action" sx={{ mr: 1 }} />,
                            },
                          },
                        }}
                      />
                      <TimePicker
                        label="End Time"
                        value={formData.end_time}
                        onChange={(time) => handleChange("end_time", time)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!formErrors.end_time,
                            helperText: formErrors.end_time,
                            InputProps: {
                              startAdornment: <TimeIcon color="action" sx={{ mr: 1 }} />,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              )}

              {activeStep === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Purpose of Booking"
                      value={formData.purpose}
                      onChange={(e) => handleChange("purpose", e.target.value)}
                      error={!!formErrors.purpose}
                      helperText={formErrors.purpose}
                      multiline
                      rows={3}
                      inputProps={{
                        minLength: 10
                      }}
                      InputProps={{
                        startAdornment: <PurposeIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Number of Attendees"
                      type="number"
                      value={formData.attendees}
                      onChange={(e) => handleChange("attendees", e.target.value)}
                      error={!!formErrors.attendees}
                      helperText={formErrors.attendees}
                      InputProps={{
                        startAdornment: <AttendeesIcon color="action" sx={{ mr: 1 }} />,
                        inputProps: { min: 1 }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Notes (Optional)"
                      multiline
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      error={!!formErrors.notes}
                      helperText={formErrors.notes}
                      inputProps={{
                        minLength: 10
                      }}
                      InputProps={{
                        startAdornment: <NotesIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 2 && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <FacilityIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Facility"
                        secondary={facilities.find(f => f.facility_id === formData.facility_id)?.name || "N/A"}
                      />
                    </ListItem>
                    
                    <Divider variant="inset" component="li" />
                    
                    <ListItem>
                      <ListItemIcon>
                        <DateIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Date & Time"
                        secondary={
                          `${formData.date?.toLocaleDateString()} • 
                          ${formData.start_time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          ${formData.end_time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        }
                      />
                    </ListItem>
                    
                    <Divider variant="inset" component="li" />
                    
                    <ListItem>
                      <ListItemIcon>
                        <PurposeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Purpose"
                        secondary={formData.purpose}
                        secondaryTypographyProps={{ style: { whiteSpace: 'pre-wrap' } }}
                      />
                    </ListItem>
                    
                    <Divider variant="inset" component="li" />
                    
                    <ListItem>
                      <ListItemIcon>
                        <AttendeesIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Attendees"
                        secondary={formData.attendees}
                      />
                    </ListItem>
                    
                    {formData.notes && (
                      <>
                        <Divider variant="inset" component="li" />
                        <ListItem>
                          <ListItemIcon>
                            <NotesIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Additional Notes"
                            secondary={formData.notes}
                            secondaryTypographyProps={{ style: { whiteSpace: 'pre-wrap' } }}
                          />
                        </ListItem>
                      </>
                    )}
                  </List>
                </Paper>
              )}

              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 4,
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="outlined"
                  onClick={activeStep === 0 ? () => navigate("/bookings") : handleBack}
                  disabled={submitting}
                  size="large"
                  sx={{ 
                    flex: 1,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  {activeStep === 0 ? "Cancel Booking" : "Back"}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={submitting}
                  size="large"
                  sx={{ 
                    flex: 1,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  {activeStep === steps.length - 1 ? (
                    <>
                      Confirm Booking
                      {submitting && <CircularProgress size={24} sx={{ ml: 2 }} />}
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default CreateBookingPage