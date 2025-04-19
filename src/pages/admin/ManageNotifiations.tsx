"use client"

import React, { useState } from "react"
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material"
import { emailservice } from "@/services/emailservice";


const ManageNotifications = () => {
  const [recipientType, setRecipientType] = useState<string>("ALL")
  const [subject, setSubject] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
  
      const payload = {
        recipient_type: recipientType,
        subject,
        message,
      };
  
      // ✅ Use your custom Axios instance instead of raw axios
      const response = await emailservice.post("/emails/broadcast", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      console.log("Response data:", response.data);
  
      if (response.data && response.data.status === "success") {
        setSuccess(response.data.message || "Notification sent successfully!");
        setSubject("");
        setMessage("");
      } else {
        setError(response.data?.message || "Something went wrong");
      }
    } catch (err: any) {
      console.error("Full error:", err);
  
      let errorMessage = "Failed to send notification";
      if (err.response?.status === 400) {
        errorMessage = "Invalid request data";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.request) {
        errorMessage = "No response from server - check your connection";
      }
  
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <section>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Notifications
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Recipient Type</InputLabel>
              <Select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                label="Recipient Type"
              >
                <MenuItem value="ALL">All Users</MenuItem>
                <MenuItem value="STAFF">Staff Only</MenuItem>
                <MenuItem value="RESIDENTS">Residents Only</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Message"
              multiline
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSubject("")
                  setMessage("")
                  setError(null)
                  setSuccess(null)
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !subject.trim() || !message.trim()}
              >
                {loading ? <CircularProgress size={24} /> : "Send Notification"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </section>
  )
}

export default ManageNotifications
