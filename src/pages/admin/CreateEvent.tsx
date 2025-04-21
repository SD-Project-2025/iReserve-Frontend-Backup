"use client"

import { useEffect, useState } from "react"
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
  Checkbox,
  FormControlLabel,
  Snackbar,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
import { useNavigate } from "react-router-dom"
import { api } from "@/services/api"

interface Facility {
  facility_id: number
  name: string
  type: string
  status: string
  capacity: number
  image_url: string
}

const CreateEventPage = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    facility_id: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    start_time: null as Date | null,
    end_time: null as Date | null,
    capacity: "",
    image_url: "",
    is_public: true,
    registration_deadline: null as Date | null,
    fee: "0",
  })

  const [formErrors, setFormErrors] = useState({
    title: "",
    description: "",
    facility_id: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    capacity: "",
    registration_deadline: "",
  })

  const getStrippedDate = (offsetDays: number) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + offsetDays)
    return date
  }

  const minEventDate = getStrippedDate(2)

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        const res = await api.get("/facilities?status=open")
        setFacilities(res.data.data)
      } catch (err) {
        setError("Failed to load facilities. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchFacilities()
  }, [])

  const handleChange = (field: string, value: any) => {
    if (field === "facility_id") {
      const selectedFacility = facilities.find(f => f.facility_id === value)
      setFormData(prev => ({
        ...prev,
        facility_id: value,
        capacity: selectedFacility?.capacity.toString() || "",
        image_url: selectedFacility?.image_url || "",
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))
    }

    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateStep = () => {
    const errors = {
      title: "",
      description: "",
      facility_id: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      capacity: "",
      registration_deadline: "",
    }

    let isValid = true
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (activeStep === 0) {
      if (!formData.title.trim()) {
        errors.title = "Title is required"
        isValid = false
      } else if (formData.title.trim().length < 5) {
        errors.title = "Title must be at least 5 characters"
        isValid = false
      }

      if (!formData.description.trim()) {
        errors.description = "Description is required"
        isValid = false
      }

      if (!formData.facility_id) {
        errors.facility_id = "Please select a facility"
        isValid = false
      }
    } else if (activeStep === 1) {
      if (!formData.start_date) {
        errors.start_date = "Start date is required"
        isValid = false
      } else if (formData.start_date < minEventDate) {
        errors.start_date = "Start date must be at least 2 days from today"
        isValid = false
      }

      if (!formData.end_date) {
        errors.end_date = "End date is required"
        isValid = false
      } else if (formData.start_date && formData.end_date < formData.start_date) {
        errors.end_date = "End date must be on or after start date"
        isValid = false
      }

      if (!formData.start_time) {
        errors.start_time = "Start time is required"
        isValid = false
      }

      if (!formData.end_time) {
        errors.end_time = "End time is required"
        isValid = false
      } else if (
        formData.start_time && 
        formData.end_time && 
        formData.start_date && 
        formData.end_date &&
        formData.start_date.getTime() === formData.end_date.getTime() &&
        formData.end_time <= formData.start_time
      ) {
        errors.end_time = "End time must be after start time"
        isValid = false
      }

      if (!formData.capacity || isNaN(Number(formData.capacity))) {
        errors.capacity = "Valid capacity is required"
        isValid = false
      }

      if (formData.start_date && formData.start_time) {
        const startDateTime = new Date(
          formData.start_date.getFullYear(),
          formData.start_date.getMonth(),
          formData.start_date.getDate(),
          formData.start_time.getHours(),
          formData.start_time.getMinutes()
        )
        if (startDateTime < new Date()) {
          errors.start_date = "Start date/time must be in the future"
          errors.start_time = "Start date/time must be in the future"
          isValid = false
        }
      }
    } else if (activeStep === 2) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (!formData.registration_deadline) {
        errors.registration_deadline = "Registration deadline is required"
        isValid = false
      } else {
        const deadline = new Date(formData.registration_deadline)
        deadline.setHours(0, 0, 0, 0)

        if (deadline < today) {
          errors.registration_deadline = "Deadline cannot be in the past"
          isValid = false
        }

        if (formData.start_date) {
          const startDate = new Date(formData.start_date)
          startDate.setHours(0, 0, 0, 0)
          if (deadline > startDate) {
            errors.registration_deadline = "Deadline must be on or before the start date"
            isValid = false
          }
        }
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleNext = () => {
    if (validateStep()) setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    try {
      setSubmitting(true)
      setError(null)

      const payload = {
        title: formData.title,
        description: formData.description,
        facility_id: Number(formData.facility_id),
        start_date: formData.start_date?.toISOString().split("T")[0],
        end_date: formData.end_date?.toISOString().split("T")[0],
        start_time: formData.start_time?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        end_time: formData.end_time?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        organizer_staff_id: 13,
        status: "upcoming",
        capacity: Number(formData.capacity),
        image_url: formData.image_url,
        is_public: formData.is_public,
        registration_deadline: formData.registration_deadline?.toISOString().split("T")[0],
        fee: Number(formData.fee) || 0,
      }

      await api.post("/events", payload)
      setShowSuccessToast(true)
      setTimeout(() => {
        navigate("/events")
      }, 2000) // Navigate after showing the toast for 2 seconds
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create event. Please check all fields.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseToast = () => {
    setShowSuccessToast(false)
  }

  const steps = ["Event Details", "Schedule & Capacity", "Finalize"]

  return (
    <section>
      <Typography variant="h4" gutterBottom>Create Event</Typography>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title *"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      error={!!formErrors.title}
                      helperText={formErrors.title}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description *"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      error={!!formErrors.description}
                      helperText={formErrors.description}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!formErrors.facility_id}>
                      <InputLabel>Facility *</InputLabel>
                      <Select
                        value={formData.facility_id}
                        label="Facility *"
                        onChange={(e) => handleChange("facility_id", e.target.value)}
                      >
                        {facilities.map(facility => (
                          <MenuItem key={facility.facility_id} value={facility.facility_id}>
                            {facility.name} ({facility.type})
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{formErrors.facility_id}</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              {activeStep === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date *"
                      value={formData.start_date}
                      onChange={(date) => handleChange("start_date", date)}
                      minDate={minEventDate}
                      slotProps={{
                        textField: {
                          error: !!formErrors.start_date,
                          helperText: formErrors.start_date,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date *"
                      value={formData.end_date}
                      onChange={(date) => handleChange("end_date", date)}
                      minDate={formData.start_date || minEventDate}
                      slotProps={{
                        textField: {
                          error: !!formErrors.end_date,
                          helperText: formErrors.end_date,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Start Time *"
                      value={formData.start_time}
                      onChange={(time) => handleChange("start_time", time)}
                      slotProps={{
                        textField: {
                          error: !!formErrors.start_time,
                          helperText: formErrors.start_time,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="End Time *"
                      value={formData.end_time}
                      onChange={(time) => handleChange("end_time", time)}
                      minTime={formData.start_date?.getTime() === formData.end_date?.getTime() ? formData.start_time : undefined}
                      slotProps={{
                        textField: {
                          error: !!formErrors.end_time,
                          helperText: formErrors.end_time,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Capacity *"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleChange("capacity", e.target.value)}
                      error={!!formErrors.capacity}
                      helperText={formErrors.capacity}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Fee ($)"
                      type="number"
                      value={formData.fee}
                      onChange={(e) => handleChange("fee", e.target.value)}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <DatePicker
                      label="Registration Deadline *"
                      value={formData.registration_deadline}
                      onChange={(date) => handleChange("registration_deadline", date)}
                      minDate={new Date()}
                      maxDate={formData.start_date || undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!formErrors.registration_deadline,
                          helperText: formErrors.registration_deadline,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Image URL"
                      value={formData.image_url}
                      onChange={(e) => handleChange("image_url", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.is_public}
                          onChange={(e) => handleChange("is_public", e.target.checked)}
                        />
                      }
                      label="Public Event (visible to all residents)"
                    />
                  </Grid>
                </Grid>
              )}

              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button
                  variant="outlined"
                  onClick={activeStep === 0 ? () => navigate("/events") : handleBack}
                  disabled={submitting}
                >
                  {activeStep === 0 ? "Cancel" : "Back"}
                </Button>
                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={submitting}
                  endIcon={submitting && <CircularProgress size={24} />}
                >
                  {activeStep === steps.length - 1 ? "Create Event" : "Next"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={showSuccessToast}
        autoHideDuration={2000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity="success" sx={{ width: '100%' }}>
          An event created successfully!
        </Alert>
      </Snackbar>
    </section>
  )
}

export default CreateEventPage