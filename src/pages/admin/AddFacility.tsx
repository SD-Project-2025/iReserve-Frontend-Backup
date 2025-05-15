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
  IconButton,
  LinearProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { api } from "@/services/api";
import { debounce } from "@mui/material/utils";
import { useAuth } from "@/contexts/AuthContext";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";

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
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageUploaded, setImageUploaded] = useState(false);

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
    description: "", // Added description to form errors
  });

  // Check if user has permission to access this page
  useEffect(() => {
    if (user && user.type !== "staff") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Real-time validation for individual fields
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 3) return "Name must be at least 3 characters";
        if (conflicts.name) return "Name already in use";
        return "";
      
      case "type":
        if (!value) return "Type is required";
        return "";
      
      case "location":
        if (!value.trim()) return "Location is required";
        if (conflicts.location) return "Location already in use";
        return "";
      
      case "capacity":
        if (!value) return "Capacity is required";
        if (isNaN(Number(value))) return "Capacity must be a number";
        if (Number(value) <= 0) return "Capacity must be greater than 0";
        if (Number(value) > 10000) return "Capacity seems too high (max 10,000)";
        return "";
      
      case "open_time":
        if (!value) return "Opening time is required";
        return "";
      
      case "close_time":
        if (!value) return "Closing time is required";
        if (formData.open_time && value <= formData.open_time) {
          return "Closing time must be after opening time";
        }
        return "";
      
      case "description":
        if (!value.trim()) return "Description is required";
        if (value.trim().length < 10) return "Description should be at least 10 characters";
        if (value.trim().length > 500) return "Description is too long (max 500 characters)";
        return "";
      
      default:
        return "";
    }
  };

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

    // Check for name/location conflicts
    if (field === "name" || field === "location") {
      checkAvailability(
        field === "name" ? value.trim() : formData.name.trim(),
        field === "location" ? value.trim() : formData.location.trim()
      );
    }

    // Real-time validation feedback
    const errorMessage = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: errorMessage }));
    
    // Clear general error when user fixes fields
    if (error && errorMessage === "" && formErrors[field as keyof typeof formErrors] !== "") {
      setError(null);
    }
  };
  
  // Handle file selection for image upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);

      // Create a preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Reset upload status
      setImageUploaded(false);
      
      // Clear the image URL field since we'll be using the uploaded file
      setFormData(prev => ({
        ...prev,
        image_url: "",
      }));
    }
  };

  // Handle clearing selected file
  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setImageUploaded(false);
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async () => {
    if (!imageFile) {
      setError("Please select an image first");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(20);

    try {
      // Check file size before uploading - fail early with friendly message
      const fileSizeInMB = imageFile.size / (1024 * 1024);
      if (fileSizeInMB > 5) {
        throw new Error(`File size (${fileSizeInMB.toFixed(2)}MB) exceeds the 5MB limit`);
      }
      
      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', 'ireserve_facilities'); // Facility-specific upload preset
      // No need to specify folder as it's configured in the preset
      
      setUploadProgress(40);
      
      // Upload directly to Cloudinary using your cloud name
      const response = await fetch('https://api.cloudinary.com/v1_1/dixssghji/image/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error && errorData.error.message) {
          throw new Error(errorData.error.message);
        }
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      const result = await response.json();
      setUploadProgress(100);
      
      console.log("Upload successful:", result.secure_url);
      setImageUploaded(true);
      
      // Update form data with the image URL
      setFormData(prev => ({
        ...prev,
        image_url: result.secure_url,
      }));
      
      return result.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      let errorMessage = "Failed to upload image.";
      if (error instanceof Error) {
        errorMessage += ` ${error.message}`;
      }
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle upload button click
  const handleUploadClick = async () => {
    if (!imageFile) {
      setError("Please select an image file first");
      return;
    }

    await uploadToCloudinary();
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
      description: "", // Added description to errors
    };

    let isValid = true;

    // Name validation
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

    // Type validation
    if (!formData.type) {
      errors.type = "Type is required";
      isValid = false;
    }

    // Location validation
    if (!formData.location.trim()) {
      errors.location = "Location is required";
      isValid = false;
    } else if (conflicts.location) {
      errors.location = "Location already in use";
      isValid = false;
    }

    // Capacity validation
    if (!formData.capacity) {
      errors.capacity = "Capacity is required";
      isValid = false;
    } else if (isNaN(Number(formData.capacity))) {
      errors.capacity = "Capacity must be a number";
      isValid = false;
    } else if (Number(formData.capacity) <= 0) {
      errors.capacity = "Capacity must be greater than 0";
      isValid = false;
    } else if (Number(formData.capacity) > 10000) {
      errors.capacity = "Capacity seems too high (max 10,000)";
      isValid = false;
    }

    // Time validation
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

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Description is required";
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description should be at least 10 characters";
      isValid = false;
    } else if (formData.description.trim().length > 500) {
      errors.description = "Description is too long (max 500 characters)";
      isValid = false;
    }

    // Image validation with user-friendly messages
    if (imageFile && !imageUploaded) {
      // Don't set form errors for image - use error state for visibility
      setError("Please click the 'Upload Image' button to complete the upload");
      return false;
    } else if (!imageFile && !imageUploaded) {
      setError("Please select and upload an image for the facility");
      return false;
    }

    setFormErrors(errors);
    
    // Show a summary message if multiple errors to help guide the user
    if (!isValid) {
      const errorCount = Object.values(errors).filter(e => e).length;
      if (errorCount > 1) {
        setError(`Please fix the ${errorCount} highlighted fields to continue`);
      } else {
        setError(null); // Clear error if only one field error (field error is sufficient)
      }
    } else {
      setError(null);
    }
    
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
      };

      console.log("Submitting facility data:", payload); // Debug log

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

  const isSubmitDisabled = () => {
    return (
      submitting || 
      !!nameError || 
      conflicts.name || 
      conflicts.location || 
      (imageFile && !imageUploaded) || 
      (!imageFile && !imageUploaded) ||
      isUploading
    );
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
          {Object.values(formErrors).some(e => e) && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Please fix the highlighted fields before submitting
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!formErrors.name || conflicts.name}
                helperText={formErrors.name || (conflicts.name ? "Name already in use" : "")}
                onBlur={() => {
                  // Validate on blur for more complete feedback
                  if (formData.name) {
                    const errorMessage = validateField("name", formData.name);
                    setFormErrors(prev => ({ ...prev, name: errorMessage }));
                  }
                }}
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
                onBlur={() => {
                  if (formData.location) {
                    const errorMessage = validateField("location", formData.location);
                    setFormErrors(prev => ({ ...prev, location: errorMessage }));
                  }
                }}
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
                helperText={formErrors.capacity || "Enter the maximum number of people"}
                inputProps={{ min: 1 }}
                onBlur={() => {
                  if (formData.capacity) {
                    const errorMessage = validateField("capacity", formData.capacity);
                    setFormErrors(prev => ({ ...prev, capacity: errorMessage }));
                  }
                }}
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

            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Facility Image *
              </Typography>
              
              {/* Better Image Guidelines - Improvement #5 */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                For best results, use images with a 16:9 aspect ratio, at least 1200x675 pixels.
                Maximum file size: 5MB. Supported formats: JPG, PNG, WebP.
              </Typography>
              
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={isUploading || submitting}
                >
                  Select Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                
                {imageFile && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {imageFile.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={handleClearFile}
                        disabled={isUploading || submitting}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Box>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUploadClick}
                      disabled={isUploading || !imageFile || imageUploaded}
                    >
                      {imageUploaded ? "Uploaded" : "Upload Image"}
                    </Button>
                  </>
                )}
              </Box>
              
              {previewUrl && (
                <Box sx={{ mb: 2, maxWidth: 300 }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                  />
                </Box>
              )}
              
              {isUploading && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                  />
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                    Uploading: {uploadProgress}%
                  </Typography>
                </Box>
              )}
              
              {/* Optimization Feedback - Improvement #4 */}
              {imageUploaded && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Image uploaded and optimized for web successfully!
                </Alert>
              )}

              {!imageFile && !imageUploaded && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please select and upload an image for the facility.
                </Alert>
              )}
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
                helperText={formErrors.description || "Provide details about the facility (min 10 characters)"}
                onBlur={() => {
                  if (formData.description) {
                    const errorMessage = validateField("description", formData.description);
                    setFormErrors(prev => ({ ...prev, description: errorMessage }));
                  }
                }}
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
              onClick={() => {
                // First validate all fields for better user feedback
                const allFields = ["name", "type", "location", "capacity", "open_time", "close_time", "description"];
                const newErrors = { ...formErrors };
                
                // Check each field and update errors
                allFields.forEach(field => {
                  const fieldValue = formData[field as keyof FacilityFormData];
                  const errorMessage = validateField(field, fieldValue);
                  newErrors[field as keyof typeof formErrors] = errorMessage;
                });
                
                setFormErrors(newErrors);
                
                // Only proceed if validation passes
                if (Object.values(newErrors).every(e => !e)) {
                  handleSubmit();
                } else {
                  setError("Please fill in all required fields correctly");
                }
              }}
              disabled={isSubmitDisabled()}
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