"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Add as AddIcon } from "@mui/icons-material"
import { api } from "@/services/api"

interface MaintenanceReport {
  report_id: number
  title: string
  description: string
  facility: {
    name: string
    facility_id: number
  }
  reported_date: string
  status: string
  priority: string
}

const MaintenancePage = () => {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [reports, setReports] = useState<MaintenanceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMaintenanceReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/maintenance/my-reports")
        setReports(response.data.data)
      } catch (err) {
        console.error("Error fetching maintenance reports:", err)
        setError("Failed to load maintenance reports. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchMaintenanceReports()
  }, [])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success"
      case "in-progress":
      case "scheduled":
        return "warning"
      case "reported":
        return "info"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "error"
      case "medium":
        return "warning"
      case "low":
        return "info"
      default:
        return "default"
    }
  }

  // Filter reports based on tab
  const filteredReports = reports.filter((report) => {
    if (tabValue === 0) return true // All reports
    if (tabValue === 1) return report.status === "reported" // Reported
    if (tabValue === 2) return report.status === "in-progress" || report.status === "scheduled" // In Progress
    if (tabValue === 3) return report.status === "completed" // Completed
    return true
  })

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Maintenance Reports
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/maintenance/create")}>
          Report Issue
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="maintenance report tabs">
            <Tab label="All" id="tab-0" />
            <Tab label="Reported" id="tab-1" />
            <Tab label="In Progress" id="tab-2" />
            <Tab label="Completed" id="tab-3" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredReports.length > 0 ? (
            <List>
              {filteredReports.map((report, index) => (
                <Box key={report.report_id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    alignItems="flex-start"
                    sx={{ py: 2 }}
                    secondaryAction={
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        <Chip label={report.status} color={getStatusColor(report.status) as any} size="small" />
                        <Chip
                          label={report.priority}
                          color={getPriorityColor(report.priority) as any}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          component="div"
                          sx={{ fontWeight: 500, cursor: "pointer" }}
                          onClick={() => navigate(`/maintenance/${report.report_id}`)}
                        >
                          {report.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary" display="block">
                            {report.facility?.name}
                          </Typography>
                          <Typography component="span" variant="body2" display="block" sx={{ mt: 0.5 }}>
                            {report.description.length > 100
                              ? `${report.description.substring(0, 100)}...`
                              : report.description}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            Reported on {new Date(report.reported_date).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No maintenance reports found</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate("/maintenance/create")}
                sx={{ mt: 2 }}
              >
                Report an Issue
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default MaintenancePage
