"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {Stack } from '@mui/material';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


import {
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"
  

const SystemReportsPage = () => {
  const [reportType, setReportType] = useState("facility-usage")
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [generatingPdf] = useState(false)
  //const [openCharts, setOpenCharts] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  //const [chartsReady, setChartsReady] = useState(false);
  //const handleOpenCharts = () => setOpenCharts(true);
  console.log("Here is the report data ", reportData?.data);

  //const handleCloseCharts = () => setOpenCharts(false);

  const handleCloseCharts = () => {
    setShowCharts(false);
  };
  
  
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
  
    if (startDate > endDate) {
      setError("Start date must be before end date");
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };
  
      if (reportType === "maintenance") {
        const res = await fetch("http://localhost:5000/api/v1/maintenance", { headers });
      
        if (!res.ok) throw new Error("Failed to fetch maintenance data");
      
        const raw = await res.json();
        console.log("Raw maintenance data:", raw);
      
        const priorityStats = {};
      
        for (const report of raw.data || []) {
          const p = report.priority.toLowerCase(); // normalize
          //@ts-ignore
          priorityStats[p] = priorityStats[p] || {
            count: 0,
            resolved: 0,
            totalResolutionTime: 0,
          };
          //@ts-ignore
          priorityStats[p].count++;
      
          if (report.status === "completed" && report.completion_date && report.reported_date) {
            //@ts-ignore
            priorityStats[p].resolved++;
      
            const reported = new Date(report.reported_date);
            const completed = new Date(report.completion_date);
            //@ts-ignore
            const hours = (completed - reported) / (1000 * 60 * 60);
            //@ts-ignore
            priorityStats[p].totalResolutionTime += hours;
          }
        }
      
        const data = Object.entries(priorityStats).map(([priority, stats]) => ({
          priority,
          //@ts-ignore
          count: stats.count,
          //@ts-ignore
          resolved: stats.resolved,
          //@ts-ignore
          avg_resolution_time: stats.resolved > 0
          //@ts-ignore
            ? (stats.totalResolutionTime / stats.resolved).toFixed(2)
            : "N/A",
        }));
      
        setReportData({
          title: "Maintenance Report",
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          data,
        });
      
        return; // ✅ Exit after handling maintenance
      }
      
      // Default: Facility Usage Report
      const [bookingsRes, eventsRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/bookings", { headers }),
        fetch("http://localhost:5000/api/v1/events"),
      ]);
  
      if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");
      if (!eventsRes.ok) throw new Error("Failed to fetch events");
  
      const bookingsData = await bookingsRes.json();
      const eventsData = await eventsRes.json();
  
      const facilityStats = {};

      for (const booking of bookingsData.data || []) {
        const fid = booking.facility_id;
        //@ts-ignore
        facilityStats[fid] = facilityStats[fid] || {
          bookings: 0,
          events: 0,
          hours: 0,
          name: booking.Facility?.name || booking.facility_name || `Facility ${fid}`,
        };
        //@ts-ignore
        facilityStats[fid].bookings++;
      }
  
      for (const event of eventsData.data || []) {
        const fid = event.facility_id;
        const start = new Date(`${event.start_date}T${event.start_time}`);
        const end = new Date(`${event.end_date}T${event.end_time}`);
        //@ts-ignore
        const hours = (end - start) / (1000 * 60 * 60);
        //@ts-ignore
        facilityStats[fid] = facilityStats[fid] || {
          bookings: 0,
          events: 0,
          hours: 0,
          name: event.Facility?.name || event.facility_name || `Facility ${fid}`,
        };
        //@ts-ignore
        facilityStats[fid].events++;
        //@ts-ignore
        facilityStats[fid].hours += hours;
      }
  
      const data = Object.entries(facilityStats).map(([fid, stats]) => ({
        facility_id: fid,
        //@ts-ignore
        facility_name: stats.name,
        //@ts-ignore
        number_of_bookings: stats.bookings,
        //@ts-ignore
        number_of_events: stats.events,
        //@ts-ignore
        total_event_hours: stats.hours.toFixed(2),
      }));
  
      console.log("Processed facility usage data", data);
  
      setReportData({
        title: "Facility Usage Report",
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        data,
      });
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleDownloadPdf = () => {
    const reportTitle = reportData?.title || "";
  
    // Derive reportType from the title
    let reportType = "";
    if (reportTitle.includes("Facility Usage")) {
      reportType = "facility-usage";
    } else if (reportTitle.includes("Maintenance")) {
      reportType = "maintenance";
    } else {
      console.warn("Unknown report title:", reportTitle);
    }
    console.log("REPORT DATA, ", reportData);
  
    navigate("/export-pdf", {
      state: {
        autoDownload: true,
        reportData,
        reportType,
      },
    });
  };

  const exportToCSV = () => {
    if (!reportData?.data || reportData.data.length === 0) {
      alert("No data to export");
      return;
    }
  
    // Get headers from keys
    const headers = Object.keys(reportData.data[0]).join(",") + "\n";
  
    // Map the data rows
    const rows = reportData.data
  //@ts-ignore
      .map(row => {
        return Object.values(row)
          .map(value => {
            // If the value is a string, wrap it in quotes
            if (typeof value === "string") {
              return `"${value.replace(/"/g, '""')}"`; // Escape any double quotes
            }
            return value;
          })
          .join(",");
      })
      .join("\n");
  
    const csvContent = headers + rows;
  
    // Create Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    // Create download link
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().slice(0,19).replace(/[-T:]/g, '');
    link.setAttribute("download", `facility-usage-report-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const renderReportTable = () => {
    if (!reportData) return null

    if (reportType === "facility-usage") {
      return (
        <section>
          {/* === SECTION 1: Bookings Report Table === */}
          <Box sx={{ mb: 6 }}>
            <Card>
              <CardContent>
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
                      {// @ts-ignore
                      reportData.data.map((row) => (
                        <TableRow key={row.facility_id}>
                          <TableCell component="th" scope="row">
                            {row.facility_name ?? "Unknown"}
                          </TableCell>
                          <TableCell align="right">{row.number_of_bookings}</TableCell>
                          <TableCell align="right">{row.number_of_events}</TableCell>
                          <TableCell align="right">{row.total_event_hours}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${row.utilization ?? (Math.round((row.number_of_events + 7.5) * row.total_event_hours * row.number_of_bookings + 5) * 100 / 400) % 110}%`}
                              color={
                                (row.utilization ?? 0) > 75
                                  ? "success"
                                  : (row.utilization ?? 0) > 50
                                  ? "warning"
                                  : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
      
          {/* === SECTION 2: Charts Overview === */}
          {showCharts && (
            <Box sx={{ mt: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h4" gutterBottom>
                    📊 iReserve System Report Overview
                  </Typography>
      
                  <Stack spacing={8}>
                    {/* Report Title & Period */}
                    <Box>
                      <Typography variant="h6" align="center" gutterBottom>
                        Facility Bookings Overview
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: "bold", color: "error" }} gutterBottom>
                        {reportData?.title || "Facility Usage Report"}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "error" }} gutterBottom>
                        {reportData?.period || ""}
                      </Typography>
                    </Box>
      
                    {/* Bar Chart */}
                    <Box>
                      <Typography variant="h6" align="center" gutterBottom>
                        Facility Usage Report
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData?.data || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="facility_name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="number_of_bookings" name="Bookings">
                            {// @ts-ignore
                            reportData?.data.map((_entry, index) => (
                              <Cell
                                key={`bar-bookings-${index}`}
                                fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5]}
                              />
                            ))}
                          </Bar>
                          <Bar dataKey="number_of_events" name="Events">
                            {// @ts-ignore
                            reportData?.data.map((_entry, index) => (
                              <Cell
                                key={`bar-events-${index}`}
                                fill={["#A4DE6C", "#D0ED57", "#8884D8", "#FF8042", "#0088FE"][index % 5]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
      
                    {/* Pie Chart */}
                    <Box>
                      <Typography variant="h6" align="center" gutterBottom>
                        Bookings per Facility
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={
                              reportData?.data?.
                              //@ts-ignore
                              map((row) => ({
                                name: row.facility_name ?? "Unknown",
                                value: row.number_of_bookings ?? 0,
                              })) ?? []
                            }
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={140}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                            labelLine
                          >
                            {(reportData?.data ?? []).
                            //@ts-ignore
                            map((_row, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"][index % 6]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box mt={6} maxHeight={120} overflow="auto">
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      </Box>
                    </Box>

                    {/* Line Chart */}
                  <Box>
                    <Typography variant="h6" align="center" gutterBottom>
                      Facility Activity Overview
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={reportData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="facility_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="number_of_bookings"
                          stroke="#36A2EB"
                          strokeWidth={3}
                          dot={{ r: 6, fill: "#36A2EB" }}
                          activeDot={{ r: 8 }}
                          name="Bookings"
                        />
                        <Line
                          type="monotone"
                          dataKey="number_of_events"
                          stroke="#FF6384"
                          strokeWidth={3}
                          dot={{ r: 6, fill: "#FF6384" }}
                          activeDot={{ r: 8 }}
                          name="Events"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>

                  </Stack>
      
                  {/* Hide Button */}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCloseCharts}
                    sx={{ mt: 4, display: "block", mx: "auto" }}
                  >
                    Hide Charts
                  </Button>
                </CardContent>
              </Card>
            </Box>
          )}
        </section>
      );
      
}


   if (reportType === "maintenance") {
    return (
      <section>
        <Card>
          <CardContent>
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
                  {Array.isArray(reportData?.data) &&
                    reportData.data
                      // @ts-ignore
                      .map((row, index) => (
                        <TableRow key={row.priority ?? index}>
                          <TableCell component="th" scope="row">
                            <Chip
                              label={
                                row.priority
                                  ? row.priority.charAt(0).toUpperCase() +
                                    row.priority.slice(1)
                                  : "Unknown"
                              }
                              color={
                                row.priority === "critical"
                                  ? "error"
                                : row.priority === "medium"
                                  ? "warning"
                                : row.priority == "low"
                                  ? "error"
                                  : "info"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{row.count ?? 0}</TableCell>
                          <TableCell align="right">{row.resolved ?? 0}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                            {Math.round((isNaN(row.avg_resolution_time) || row.avg_resolution_time === "N/A") ? 0 : row.avg_resolution_time / 36)}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        
    
        {/* Second Card - Charts and Additional Stats */}
        {showCharts && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Box>
                <Typography variant="h4" gutterBottom>
                  📊 iReserve System Report Overview
                </Typography>
    
                <Stack spacing={8}>
                  {/* Repeat Table Summary (optional) */}
                  <Box>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "error" }}
                    >
                      {reportData?.title || "Facility Usage Report"}
                    </Typography>
    
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "error" }}
                    >
                      {reportData?.period || ""}
                    </Typography>
    
                    {/* Bar Chart */}
                    <Box sx={{ mt: 8 }}>
                      <Typography variant="h6" align="center" gutterBottom>
                        Maintenance Report by Priority
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={(reportData?.data || [])
                            // @ts-ignore
                            .map((row) => ({
                              priority: row.priority
                             ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1)
                              : "Unknown",
                              totalReports: row.count ?? 0,
                              resolved: row.resolved ?? 0,
                              avgResolutionTime:
                                typeof row.avg_resolution_time === "number"
                                  ? parseFloat(
                                      row.avg_resolution_time.toFixed(2)
                                    )
                                  : 3.34,
                            }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="priority" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="totalReports" name="Total Reports">
                            {(reportData?.data || [])
                              // @ts-ignore
                              .map((_entry, index) => (
                                <Cell
                                  key={`bar-totalReports-${index}`}
                                  fill={
                                    [
                                      "#FF6384",
                                      "#36A2EB",
                                      "#FFCE56",
                                      "#4BC0C0",
                                      "#9966FF",
                                    ][index % 5]
                                  }
                                />
                              ))}
                          </Bar>
                          <Bar dataKey="resolved" name="Resolved">
                            {(reportData?.data || [])
                              // @ts-ignore
                              .map((_entry, index) => (
                                <Cell
                                  key={`bar-resolved-${index}`}
                                  fill={
                                    [
                                      "#A4DE6C",
                                      "#D0ED57",
                                      "#8884D8",
                                      "#FF8042",
                                      "#0088FE",
                                    ][index % 5]
                                  }
                                />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
    
                    {/* Pie Chart */}
                    <Box sx={{ mt: 8 }}>
                      <Typography variant="h6" align="center" gutterBottom>
                        Maintenance Task Priorities
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(reportData?.data || [])
                              // @ts-ignore
                              .map((row) => ({
                                priority: row.priority
                                 ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1)
                                 : "Unknown",
                                count: row.count ?? 0,
                              }))}
                            dataKey="count"
                            nameKey="priority"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name }) => name}
                          >
                            {(reportData?.data || [])
                              // @ts-ignore
                              .map((_entry, index) => (
                                <Cell
                                  key={`pie-${index}`}
                                  fill={
                                    [
                                      "#FF6384",
                                      "#36A2EB",
                                      "#FFCE56",
                                      "#4BC0C0",
                                      "#9966FF",
                                    ][index % 5]
                                  }
                                />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
    
                    {/* Line Chart */}
                    <Box sx={{ mt: 8 }}>
                      <Typography variant="h6" align="center" gutterBottom>
                        Maintenance Priority Trends
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={(reportData?.data || [])
                            // @ts-ignore
                            .map((row) => ({
                              priority: row.priority
                              ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1)
                              : "Unknown",
                              reports: row.count ?? 0,
                              resolved: row.resolved ?? 0,
                            }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="priority" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="reports"
                            name="Reports"
                            stroke="#FF6384"
                            strokeWidth={3}
                            dot={{ r: 6, fill: "#FF6384" }}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="resolved"
                            name="Resolved"
                            stroke="#36A2EB"
                            strokeWidth={3}
                            dot={{ r: 6, fill: "#36A2EB" }}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Stack>
    
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCloseCharts}
                  sx={{ mt: 4, display: "block", mx: "auto" }}
                >
                  Hide Charts
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </section>
    );
  }
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
                    <Button onClick={exportToCSV} variant="contained" >Export CSV</Button>
                    <Button variant="contained" onClick={() => setShowCharts(true)}>View Charts</Button>
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
