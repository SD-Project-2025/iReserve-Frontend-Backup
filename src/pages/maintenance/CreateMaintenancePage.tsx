"use client"

import type React from "react"

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
} from "@mui/material"
import { api } from "@/services/api"

interface Facility {
  facility_id: number
  name: string
  type: string
  status: string
}

const CreateMaintenancePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    facility_id: location.state?.facilityId || "",
    title: "",
    description: "",
    priority: "medium",
  })
  const [formErrors, setFormErrors] = useState({
    facility_id: "",
    title: "",
    description: "",
  })

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/facilities")
        setFacilities(response.data.data)
      } catch (err) {
        console.error("Error fetching facilities:", err)
        setError("Failed to load facilities. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchFacilities()
  }, [])

  const validateForm = () => {
    let isValid = true
    const errors = {
      facility_id: "",
      title: "",
      description: "",
    }

    if (!formData.facility_id) {
      errors.facility_id = "Please select a facility"
      isValid = false
    }

    if (!formData.title) {
      errors.title = "Please enter a title"
      isValid = false
    }

    if (!formData.description) {
      errors.description = "Please enter a description"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSubmitting(true)
      setError(null)

      await api.post("/maintenance", formData)
      navigate("/maintenance")
    } catch (err: any) {
      console.error("Error creating maintenance report:", err)
      setError(err.response?.data?.message || "Failed to create maintenance report. Please try again later.")
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

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Report Maintenance Issue
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Issue Title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    error={!!formErrors.title}
                    helperText={formErrors.title}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => handleChange("priority", e.target.value)}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                    <Button variant="outlined" onClick={() => navigate("/maintenance")}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={submitting}>
                      Submit Report
                      {submitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default CreateMaintenancePage
