"use client"

import { useState } from "react"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import {
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  BarChart as ChartIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"

// Mock data for reports
const mockFacilityUsageData = [
  { facility_id: 1, name: "Basketball Court", bookings: 45, events: 3, total_hours: 120, utilization: 78 },
  { facility_id: 2, name: "Swimming Pool", bookings: 62, events: 5, total_hours: 180, utilization: 92 },
  { facility_id: 3, name: "Tennis Court", bookings: 28, events: 2, total_hours: 84, utilization: 45 },
  { facility_id: 4, name: "Fitness Center", bookings: 53, events: 4, total_hours: 160, utilization: 86 },
  { facility_id: 5, name: "Soccer Field", bookings: 37, events: 3, total_hours: 111, utilization: 63 },
]

const mockMaintenanceData = [
  { priority: "high", count: 12, avg_resolution_time: 48, resolved: 8 },
  { priority: "medium", count: 24, avg_resolution_time: 72, resolved: 18 },
  { priority: "low", count: 15, avg_resolution_time: 120, resolved: 10 },
]

const mockUserActivityData = [
  { user_type: "resident", count: 45, active: 38, bookings: 120, event_registrations: 35 },
  { user_type: "staff", count: 8, active: 7, bookings: 15, event_registrations: 5 },
]

const SystemReportsPage = () => {
  const [reportType, setReportType] = useState("facility-usage")
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    if (startDate > endDate) {
      setError("Start date must be before end date")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // In a real app, this would call the API with the selected parameters
      // const response = await api.get(`/reports/${reportType}`, {
      //   params: {
      //     start_date: startDate.toISOString().split('T')[0],
      //     end_date: endDate.toISOString().split('T')[0],
      //   }
      // })
      // setReportData(response.data)

      // For the mock, we'll just use the mock data
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay

      if (reportType === "facility-usage") {
        setReportData({
          title: "Facility Usage Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          data: mockFacilityUsageData,
        })
      } else if (reportType === "maintenance") {
        setReportData({
          title: "Maintenance Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          data: mockMaintenanceData,
        })
      } else if (reportType === "user-activity") {
        setReportData({
          title: "User Activity Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          data: mockUserActivityData,
        })
      }
    } catch (err) {
      console.error("Error generating report:", err)
      setError("Failed to generate report. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!reportData) return

    try {
      setGeneratingPdf(true)

      // In a real app, this would call an API endpoint to generate a PDF
      // const response = await api.get(`/reports/${reportType}/pdf`, {
      //   params: {
      //     start_date: startDate?.toISOString().split('T')[0],
      //     end_date: endDate?.toISOString().split('T')[0],
      //   },
      //   responseType: 'blob'
      // })

      // For the mock, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create a mock PDF download
      alert("PDF would be downloaded in a real application")

      // In a real app, you would create a download link for the blob
      // const url = window.URL.createObjectURL(new Blob([response.data]))
      // const link = document.createElement('a')
      // link.href = url
      // link.setAttribute('download', `${reportType}-report.pdf`)
      // document.body.appendChild(link)
      // link.click()
      // link.remove()
    } catch (err) {
      console.error("Error downloading PDF:", err)
      setError("Failed to download PDF. Please try again later.")
    } finally {
      setGeneratingPdf(false)
    }
  }

  const renderReportTable = () => {
    if (!reportData) return null

    if (reportType === "facility-usage") {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Facility</TableCell>
                <TableCell align="right">Bookings</TableCell>
                <TableCell align="right">Events</TableCell>
                <TableCell align="right">Total Hours</TableCell>
                <TableCell align="right">Utilization (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((row) => (
                <TableRow key={row.facility_id}>
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.bookings}</TableCell>
                  <TableCell align="right">{row.events}</TableCell>
                  <TableCell align="right">{row.total_hours}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${row.utilization}%`}
                      color={row.utilization > 75 ? "success" : row.utilization > 50 ? "warning" : "error"}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    if (reportType === "maintenance") {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Total Reports</TableCell>
                <TableCell align="right">Resolved</TableCell>
                <TableCell align="right">Avg. Resolution Time (hours)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((row) => (
                <TableRow key={row.priority}>
                  <TableCell component="th" scope="row">
                    <Chip
                      label={row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
                      color={row.priority === "high" ? "error" : row.priority === "medium" ? "warning" : "info"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                  <TableCell align="right">{row.resolved}</TableCell>
                  <TableCell align="right">{row.avg_resolution_time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    if (reportType === "user-activity") {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Type</TableCell>
                <TableCell align="right">Total Users</TableCell>
                <TableCell align="right">Active Users</TableCell>
                <TableCell align="right">Bookings</TableCell>
                <TableCell align="right">Event Registrations</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((row) => (
                <TableRow key={row.user_type}>
                  <TableCell component="th" scope="row">
                    {row.user_type.charAt(0).toUpperCase() + row.user_type.slice(1)}
                  </TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                  <TableCell align="right">{row.active}</TableCell>
                  <TableCell align="right">{row.bookings}</TableCell>
                  <TableCell align="right">{row.event_registrations}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    return null
  }

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        System Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate Report
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="report-type-label">Report Type</InputLabel>
                    <Select
                      labelId="report-type-label"
                      value={reportType}
                      label="Report Type"
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <MenuItem value="facility-usage">Facility Usage</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="user-activity">User Activity</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ height: "56px" }}
                    onClick={handleGenerateReport}
                    disabled={loading || !startDate || !endDate}
                    startIcon={<RefreshIcon />}
                  >
                    Generate
                    {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
                  </Button>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {reportData && (
          <>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">
                      {reportData.title} ({reportData.period})
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button variant="outlined" startIcon={<TableIcon />} size="small">
                        Export CSV
                      </Button>
                      <Button variant="outlined" startIcon={<ChartIcon />} size="small">
                        View Charts
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<PdfIcon />}
                        size="small"
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf}
                      >
                        Download PDF
                        {generatingPdf && <CircularProgress size={16} sx={{ ml: 1 }} />}
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {renderReportTable()}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </section>
  )
}

export default SystemReportsPage
