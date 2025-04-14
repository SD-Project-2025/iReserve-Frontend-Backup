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
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { api } from "@/services/api"

interface Facility {
  facility_id: number
  name: string
  type: string
  status: string
}

const CreateBookingPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeStep, setActiveStep] = useState(0)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  })

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/facilities")
        // Filter only open facilities
        const openFacilities = response.data.data.filter((facility: Facility) => facility.status === "open")
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
      } else if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
        errors.end_time = "End time must be after start time"
        isValid = false
      }
    } else if (activeStep === 1) {
      if (!formData.purpose) {
        errors.purpose = "Please enter a purpose"
        isValid = false
      }

      if (!formData.attendees) {
        errors.attendees = "Please enter the number of attendees"
        isValid = false
      } else if (isNaN(Number(formData.attendees)) || Number(formData.attendees) <= 0) {
        errors.attendees = "Please enter a valid number of attendees"
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

      // Format the data for the API
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
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Booking
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!formErrors.facility_id}>
                      <InputLabel id="facility-label">Facility</InputLabel>
                      <Select
                        labelId="facility-label"
                        value={formData.facility_id}
                        label="Facility"
                        onChange={(e) => handleChange("facility_id", e.target.value)}
                      >
                        {facilities.map((facility) => (
                          <MenuItem key={facility.facility_id} value={facility.facility_id}>
                            {facility.name} ({facility.type})
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.facility_id && <FormHelperText>{formErrors.facility_id}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date"
                      value={formData.date}
                      onChange={(date) => handleChange("date", date)}
                      disablePast
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.date,
                          helperText: formErrors.date,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <TimePicker
                        label="Start Time"
                        value={formData.start_time}
                        onChange={(time) => handleChange("start_time", time)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!formErrors.start_time,
                            helperText: formErrors.start_time,
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
                      label="Purpose"
                      value={formData.purpose}
                      onChange={(e) => handleChange("purpose", e.target.value)}
                      error={!!formErrors.purpose}
                      helperText={formErrors.purpose}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Number of Attendees"
                      type="number"
                      value={formData.attendees}
                      onChange={(e) => handleChange("attendees", e.target.value)}
                      error={!!formErrors.attendees}
                      helperText={formErrors.attendees}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Notes"
                      multiline
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Booking Summary
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Facility</Typography>
                      <Typography variant="body1">
                        {facilities.find((f) => f.facility_id === formData.facility_id)?.name || "Unknown Facility"}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Date & Time</Typography>
                      <Typography variant="body1">
                        {formData.date?.toLocaleDateString()} •{" "}
                        {formData.start_time?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {formData.end_time?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Purpose</Typography>
                      <Typography variant="body1">{formData.purpose}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">Attendees</Typography>
                      <Typography variant="body1">{formData.attendees}</Typography>
                    </Box>
                    {formData.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1">Additional Notes</Typography>
                        <Typography variant="body1">{formData.notes}</Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={activeStep === 0 ? () => navigate("/bookings") : handleBack}
                  disabled={submitting}
                >
                  {activeStep === 0 ? "Cancel" : "Back"}
                </Button>
                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={submitting}
                >
                  {activeStep === steps.length - 1 ? "Submit Booking" : "Next"}
                  {submitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default CreateBookingPage
