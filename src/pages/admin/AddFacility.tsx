"use client"

import { useState, useCallback, useEffect } from "react";
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
  Snackbar,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { api } from "@/services/api";
import { debounce } from "@mui/material/utils";
import { useAuth } from "@/contexts/AuthContext";

interface FacilityFormData {
  name: string;
  type: string;
  location: string;
  capacity: string;
  image_url: string;
  is_indoor: boolean;
  description: string;
  open_time: Date | null;
  close_time: Date | null;
  status: string;
}

const facilityTypes = [
  "Auditorium",
  "Conference Room",
  "Sports Field",
  "Swimming Pool",
  "Gym",
  "Community Hall",
  "Tennis Court",
  "Basketball Court",
  "Other",
];

const facilityStatuses = ["open", "closed", "maintenance"];

const AddFacility = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [nameError, setNameError] = useState("");
  const [conflicts, setConflicts] = useState({
    name: false,
    location: false
  });

  const [formData, setFormData] = useState<FacilityFormData>({
    name: "",
    type: "",
    location: "",
    capacity: "",
    image_url: "",
    is_indoor: true,
    description: "",
    open_time: null,
    close_time: null,
    status: "open",
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
    type: "",
    location: "",
    capacity: "",
    open_time: "",
    close_time: "",
  });

  // Check if user has permission to access this page
  useEffect(() => {
    if (user && user.type !== "staff") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  // Debounced name and location availability check
  const checkAvailability = useCallback(
    debounce(async (name: string, location: string) => {
      try {
        const res = await api.get("/facilities/check-availability", {
          params: { name, location }
        });
        setConflicts(res.data.conflicts);
        if (res.data.conflicts.name) {
          setNameError("Facility with this name already exists");
        } else {
          setNameError("");
        }
      } catch (err) {
        console.error("Availability check failed:", err);
      }
    }, 500),
    []
  );

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (field === "name" || field === "location") {
      checkAvailability(
        field === "name" ? value.trim() : formData.name.trim(),
        field === "location" ? value.trim() : formData.location.trim()
      );
    }

    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const validateForm = () => {
    const errors = {
      name: "",
      type: "",
      location: "",
      capacity: "",
      open_time: "",
      close_time: "",
    };

    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters";
      isValid = false;
    } else if (conflicts.name) {
      errors.name = "Name already in use";
      isValid = false;
    }

    if (!formData.type) {
      errors.type = "Type is required";
      isValid = false;
    }

    if (!formData.location.trim()) {
      errors.location = "Location is required";
      isValid = false;
    } else if (conflicts.location) {
      errors.location = "Location already in use";
      isValid = false;
    }

    if (!formData.capacity || isNaN(Number(formData.capacity))) {
      errors.capacity = "Valid capacity is required";
      isValid = false;
    } else if (Number(formData.capacity) <= 0) {
      errors.capacity = "Capacity must be greater than 0";
      isValid = false;
    }

    if (!formData.open_time) {
      errors.open_time = "Opening time is required";
      isValid = false;
    }

    if (!formData.close_time) {
      errors.close_time = "Closing time is required";
      isValid = false;
    } else if (
      formData.open_time &&
      formData.close_time <= formData.open_time
    ) {
      errors.close_time = "Closing time must be after opening time";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        location: formData.location.trim(),
        capacity: Number(formData.capacity),
        image_url: formData.image_url.trim(),
        is_indoor: formData.is_indoor,
        description: formData.description.trim(),
        open_time: formatTime(formData.open_time),
        close_time: formatTime(formData.close_time),
        status: formData.status,
        // TypeScript fix: Use user.id instead of staff_id
        created_by: user?.id || 0, // Assuming user has an 'id' property
      };

      console.log("Submitting facility data:", payload); // Debug log

      // FIX: Use the correct API endpoint
      const response = await api.post("/facilities", payload);
      
      if (response.status === 201) {
        console.log("Facility created successfully, navigating to /facilities");
        setShowSuccessToast(true);
        setTimeout(() => {
          navigate("/facilities"); // Navigate to facilities page
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to create facility");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      const backendError = err.response?.data;
      let errorMessage = "Failed to create facility. Please try again.";

      if (backendError) {
        if (backendError.message?.includes("unique") || backendError.message?.includes("duplicate")) {
          const duplicateField = backendError.message.match(/key: \((\w+)\)/)?.[1];
          errorMessage = duplicateField 
            ? `A facility with this ${duplicateField} already exists`
            : "A facility with these details already exists";
        } else if (backendError.errors) {
          errorMessage = Object.values(backendError.errors).join("\n");
        } else if (backendError.message) {
          errorMessage = backendError.message;
        }
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseToast = () => {
    setShowSuccessToast(false);
  };

  return (
    <section>
      <Typography variant="h4" gutterBottom>
        Add New Facility
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!formErrors.name || conflicts.name}
                helperText={formErrors.name || (conflicts.name ? "Name already in use" : "")}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location *"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                error={!!formErrors.location || conflicts.location}
                helperText={formErrors.location || (conflicts.location ? "Location already in use" : "")}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.type}>
                <InputLabel>Type *</InputLabel>
                <Select
                  value={formData.type}
                  label="Type *"
                  onChange={(e) => handleChange("type", e.target.value)}
                >
                  {facilityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{formErrors.type}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {facilityStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_indoor}
                    onChange={(e) => handleChange("is_indoor", e.target.checked)}
                    color="primary"
                  />
                }
                label="Indoor Facility"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Opening Time *"
                value={formData.open_time}
                onChange={(time) => handleChange("open_time", time)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.open_time,
                    helperText: formErrors.open_time,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Closing Time *"
                value={formData.close_time}
                onChange={(time) => handleChange("close_time", time)}
                minTime={formData.open_time}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.close_time,
                    helperText: formErrors.close_time,
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
                placeholder="https://example.com/facility-image.jpg"
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
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              variant="outlined"
              onClick={() => navigate("/facilities")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !!nameError || conflicts.name || conflicts.location}
              endIcon={submitting && <CircularProgress size={24} />}
            >
              Add Facility
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={showSuccessToast}
        autoHideDuration={2000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity="success"
          sx={{ width: "100%" }}
        >
          Facility added successfully!
        </Alert>
      </Snackbar>
    </section>
  );
};

export default AddFacility;