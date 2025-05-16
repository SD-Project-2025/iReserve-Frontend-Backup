"use client"

import { useState, useEffect, useMemo } from "react"
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
  Tabs,
  Tab,
  Autocomplete,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { Stack } from "@mui/material"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Scatter,
  ScatterChart,
  ZAxis,
  ComposedChart,
} from "recharts"

import {
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  CloudSync as SyncIcon,
  TrendingUp as TrendingUpIcon,
  InsertChartOutlined as ChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as BubbleChartIcon,
  DonutLarge as DonutIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  Build as BuildIcon,
  Speed as SpeedIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material"

// Initial facility categories mapping (will be updated with backend data)
const initialFacilityCategories = {
  "Sports Facilities": [
    "Olympic Swimming Pool",
    "Squash Court",
    "Outdoor Volleyball Court",
    "Indoor Running Track",
    "Frisbee Field",
    "MSL",
  ],
  "Fitness Facilities": ["Yoga Studio", "Climbing Wall", "Boxing Ring", "Boxing Era"],
  "Martial Arts Facilities": ["Martial Arts Dojo", "Karate"],
  "Recreation Facilities": ["Esports Arena", "NOkwana", "Hall 29", "Chilling Areas"],
}

// Initial maintenance priorities (will be updated with backend data)
const initialMaintenancePriorities = ["All", "Critical", "High", "Medium", "Low"]

// Interface for facility data
interface Facility {
  id: string | number
  name: string
  category?: string
}

// Interface for maintenance priority data
interface MaintenancePriority {
  id: string | number
  name: string
  level?: number
}

// Sample data for additional charts
const generateMonthlyData = (months = 12, baseValue = 100, variance = 30) => {
  return Array.from({ length: months }, (_, i) => {
    const month = new Date(2023, i, 1).toLocaleString("default", { month: "short" })
    return {
      month,
      value: Math.max(0, baseValue + Math.floor(Math.random() * variance * 2) - variance),
      target: baseValue + 10,
    }
  })
}

const generateForecastData = (months = 6, lastValue = 100, trend = 5, variance = 10) => {
  return Array.from({ length: months }, (_, i) => {
    const month = new Date(2023, 6 + i, 1).toLocaleString("default", { month: "short" })
    const projected = lastValue + trend * (i + 1) + Math.random() * variance * 2 - variance
    const lower = projected * 0.9
    const upper = projected * 1.1
    return {
      month,
      projected: Math.round(projected),
      lowerBound: Math.round(lower),
      upperBound: Math.round(upper),
    }
  })
}

const SystemReportsPage = () => {
  const theme = useTheme()
  const [reportType, setReportType] = useState("facility-usage")
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState<Date | null>(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [generatingPdf] = useState(false)
  const [showCharts, setShowCharts] = useState(false)

  // Facility filtering state
  const [facilityCategory, setFacilityCategory] = useState<string>("All")
  const [facilityType, setFacilityType] = useState<string>("All")
  const [specificFacility, setSpecificFacility] = useState<string>("All")

  // Maintenance filtering state
  const [maintenancePriority, setMaintenancePriority] = useState<string>("All")

  // State for facility data
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityCategories, setFacilityCategories] = useState<Record<string, string[]>>(initialFacilityCategories)
  const [loadingFacilities, setLoadingFacilities] = useState(false)
  const [lastFacilityFetchTime, setLastFacilityFetchTime] = useState<Date | null>(null)

  // State for maintenance priorities
  const [maintenancePriorities, setMaintenancePriorities] = useState<string[]>(initialMaintenancePriorities)
  const [loadingPriorities, setLoadingPriorities] = useState(false)
  const [lastPriorityFetchTime, setLastPriorityFetchTime] = useState<Date | null>(null)

  // State for advanced report view
  const [activeChartTab, setActiveChartTab] = useState(0)
  const [showAdvancedReport, setShowAdvancedReport] = useState(false)

  // Derived state for available facilities based on selected category
  const [availableFacilities, setAvailableFacilities] = useState<string[]>([])

  // Flatten all facilities for the autocomplete
  const allFacilities = Object.values(facilityCategories).flat()

  // Generate sample data for additional charts
  const monthlyUsageData = useMemo(() => generateMonthlyData(12, 150, 50), [])
  const forecastData = useMemo(() => generateForecastData(6, 180, 8, 15), [])
  const maintenanceTrendData = useMemo(() => generateMonthlyData(12, 40, 20), [])
  const maintenanceForecastData = useMemo(() => generateForecastData(6, 45, 3, 10), [])

  // Calculate KPIs
  const calculateKPIs = () => {
    if (!reportData || !reportData.data || reportData.data.length === 0) return null

    if (reportType === "facility-usage") {
      const totalBookings = reportData.data.reduce((sum: number, item: any) => sum + item.number_of_bookings, 0)
      const totalEvents = reportData.data.reduce((sum: number, item: any) => sum + item.number_of_events, 0)
      const totalHours = reportData.data.reduce(
        (sum: number, item: any) => sum + Number.parseFloat(item.total_event_hours),
        0,
      )

      const avgBookingsPerFacility = totalBookings / reportData.data.length
      const avgEventsPerFacility = totalEvents / reportData.data.length
      const avgHoursPerFacility = totalHours / reportData.data.length

      // Calculate utilization percentage (simplified)
      const utilization = Math.min(95, Math.round((totalHours / (reportData.data.length * 12 * 30)) * 100))

      // Calculate revenue (simulated)
      const avgRevenuePerHour = 75 // Simulated average revenue per hour
      const totalRevenue = totalHours * avgRevenuePerHour

      // Calculate year-over-year growth (simulated)
      const yoyGrowth = Math.round(Math.random() * 30 - 5) // Between -5% and 25%

      return {
        totalBookings,
        totalEvents,
        totalHours: totalHours.toFixed(1),
        avgBookingsPerFacility: avgBookingsPerFacility.toFixed(1),
        avgEventsPerFacility: avgEventsPerFacility.toFixed(1),
        avgHoursPerFacility: avgHoursPerFacility.toFixed(1),
        utilization,
        totalRevenue: totalRevenue.toFixed(0),
        yoyGrowth,
      }
    } else if (reportType === "maintenance") {
      const totalReports = reportData.data.reduce((sum: number, item: any) => sum + item.count, 0)
      const totalResolved = reportData.data.reduce((sum: number, item: any) => sum + item.resolved, 0)

      // Calculate resolution rate
      const resolutionRate = totalReports > 0 ? Math.round((totalResolved / totalReports) * 100) : 0

      // Calculate average resolution time (hours)
      let totalResolutionTime = 0
      let validResolutionCount = 0

      reportData.data.forEach((item: any) => {
        if (item.resolved > 0 && item.avg_resolution_time !== "N/A") {
          totalResolutionTime += Number.parseFloat(item.avg_resolution_time) * item.resolved
          validResolutionCount += item.resolved
        }
      })

      const avgResolutionTime =
        validResolutionCount > 0 ? (totalResolutionTime / validResolutionCount).toFixed(1) : "N/A"

      // Calculate maintenance cost (simulated)
      const avgCostPerReport = 250 // Simulated average cost per maintenance report
      const totalCost = totalReports * avgCostPerReport

      // Calculate year-over-year change (simulated)
      const yoyChange = Math.round(Math.random() * 20 - 10) // Between -10% and 10%

      return {
        totalReports,
        totalResolved,
        resolutionRate,
        avgResolutionTime,
        totalCost: totalCost.toFixed(0),
        yoyChange,
      }
    }

    return null
  }

  const kpis = useMemo(() => calculateKPIs(), [reportData])

  // Fetch facilities from backend
  const fetchFacilities = async () => {
    setLoadingFacilities(true)
    try {
      const token = localStorage.getItem("token")
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // Fetch facilities from backend
      const res = await fetch("http://localhost:5000/api/v1/facilities", { headers })

      if (!res.ok) {
        throw new Error("Failed to fetch facilities")
      }

      const data = await res.json()
      console.log("Fetched facilities:", data)

      // Process facilities and update categories
      const fetchedFacilities: Facility[] = data.data || []
      setFacilities(fetchedFacilities)

      // Organize facilities by category
      const categories: Record<string, string[]> = {}

      // First, try to use category from backend if available
      fetchedFacilities.forEach((facility) => {
        const facilityName = facility.name
        const category = facility.category || categorizeByName(facilityName)

        if (!categories[category]) {
          categories[category] = []
        }

        if (!categories[category].includes(facilityName)) {
          categories[category].push(facilityName)
        }
      })

      // If no facilities were found, fall back to initial categories
      if (Object.keys(categories).length === 0) {
        setFacilityCategories(initialFacilityCategories)
      } else {
        setFacilityCategories(categories)
      }

      setLastFacilityFetchTime(new Date())
    } catch (err) {
      console.error("Error fetching facilities:", err)
      // Fall back to initial categories if fetch fails
      setFacilityCategories(initialFacilityCategories)
    } finally {
      setLoadingFacilities(false)
    }
  }

  // Fetch maintenance priorities from backend
  const fetchMaintenancePriorities = async () => {
    setLoadingPriorities(true)
    try {
      const token = localStorage.getItem("token")
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // Fetch maintenance priorities from backend
      // Note: Adjust the endpoint to match your actual API
      const res = await fetch("http://localhost:5000/api/v1/maintenance/priorities", { headers })

      if (!res.ok) {
        throw new Error("Failed to fetch maintenance priorities")
      }

      const data = await res.json()
      console.log("Fetched maintenance priorities:", data)

      // Process priorities
      const fetchedPriorities: MaintenancePriority[] = data.data || []

      // Extract priority names and sort by level if available
      const priorityNames = fetchedPriorities
        .sort((a, b) => {
          // Sort by level if available, otherwise by name
          if (a.level !== undefined && b.level !== undefined) {
            return a.level - b.level
          }
          return a.name.localeCompare(b.name)
        })
        .map((priority) => priority.name)

      // Always include "All" as the first option
      if (priorityNames.length > 0) {
        setMaintenancePriorities(["All", ...priorityNames])
      } else {
        // Fall back to initial priorities if none were found
        setMaintenancePriorities(initialMaintenancePriorities)
      }

      setLastPriorityFetchTime(new Date())
    } catch (err) {
      console.error("Error fetching maintenance priorities:", err)
      // Fall back to initial priorities if fetch fails
      setMaintenancePriorities(initialMaintenancePriorities)
    } finally {
      setLoadingPriorities(false)
    }
  }

  // Helper function to categorize facilities by name if backend doesn't provide categories
  const categorizeByName = (facilityName: string): string => {
    const lowerName = facilityName.toLowerCase()

    if (
      lowerName.includes("pool") ||
      lowerName.includes("court") ||
      lowerName.includes("field") ||
      lowerName.includes("track") ||
      lowerName.includes("stadium")
    ) {
      return "Sports Facilities"
    }

    if (
      lowerName.includes("gym") ||
      lowerName.includes("yoga") ||
      lowerName.includes("fitness") ||
      lowerName.includes("boxing") ||
      lowerName.includes("climbing")
    ) {
      return "Fitness Facilities"
    }

    if (lowerName.includes("martial") || lowerName.includes("karate") || lowerName.includes("dojo")) {
      return "Martial Arts Facilities"
    }

    if (lowerName.includes("arena") || lowerName.includes("hall") || lowerName.includes("chill")) {
      return "Recreation Facilities"
    }

    return "Other Facilities"
  }

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchFacilities()
    fetchMaintenancePriorities()
  }, [])

  // Effect to update available facilities when category changes
  useEffect(() => {
    if (facilityType === "All") {
      setAvailableFacilities(Object.values(facilityCategories).flat())
    } else {
      setAvailableFacilities(facilityCategories[facilityType as keyof typeof facilityCategories] || [])
    }
    setSpecificFacility("All")
  }, [facilityType, facilityCategories])

  // Effect to update report type specific data when switching report types
  useEffect(() => {
    if (reportType === "facility-usage" && shouldRefetchData(lastFacilityFetchTime)) {
      fetchFacilities()
    } else if (reportType === "maintenance" && shouldRefetchData(lastPriorityFetchTime)) {
      fetchMaintenancePriorities()
    }
  }, [reportType])

  // Helper function to determine if data should be refetched
  const shouldRefetchData = (lastFetchTime: Date | null): boolean => {
    // Refetch if never fetched or if it's been more than 5 minutes
    return !lastFetchTime || new Date().getTime() - lastFetchTime.getTime() > 5 * 60 * 1000
  }

  const handleCloseCharts = () => {
    setShowCharts(false)
  }

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

      const token = localStorage.getItem("token")
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // For facility usage reports, check if we need to refresh facility data
      if (reportType === "facility-usage" && facilityType === "All" && specificFacility === "All") {
        if (shouldRefetchData(lastFacilityFetchTime)) {
          await fetchFacilities()
        }
      }

      // For maintenance reports, check if we need to refresh priority data
      if (reportType === "maintenance" && maintenancePriority === "All") {
        if (shouldRefetchData(lastPriorityFetchTime)) {
          await fetchMaintenancePriorities()
        }
      }

      if (reportType === "maintenance") {
        const res = await fetch("http://localhost:5000/api/v1/maintenance", { headers })

        if (!res.ok) throw new Error("Failed to fetch maintenance data")

        const raw = await res.json()
        console.log("Raw maintenance data:", raw)

        const priorityStats = {}

        for (const report of raw.data || []) {
          const p = report.priority.toLowerCase() // normalize

          // Skip if priority filter is applied and doesn't match
          if (maintenancePriority !== "All" && p !== maintenancePriority.toLowerCase()) {
            continue
          }

          //@ts-ignore
          priorityStats[p] = priorityStats[p] || {
            count: 0,
            resolved: 0,
            totalResolutionTime: 0,
          }
          //@ts-ignore
          priorityStats[p].count++

          if (report.status === "completed" && report.completion_date && report.reported_date) {
            //@ts-ignore
            priorityStats[p].resolved++

            const reported = new Date(report.reported_date)
            const completed = new Date(report.completion_date)
            //@ts-ignore
            const hours = (completed - reported) / (1000 * 60 * 60)
            //@ts-ignore
            priorityStats[p].totalResolutionTime += hours
          }
        }

        const data = Object.entries(priorityStats).map(([priority, stats]) => ({
          priority,
          //@ts-ignore
          count: stats.count,
          //@ts-ignore
          resolved: stats.resolved,
          //@ts-ignore
          avg_resolution_time:
          //@ts-ignore
            stats.resolved > 0
              ? //@ts-ignore
                (stats.totalResolutionTime / stats.resolved).toFixed(2)
              : "N/A",
        }))

        // Update the title to reflect the filter
        const reportTitle =
          maintenancePriority === "All" ? "Maintenance Report" : `Maintenance Report - ${maintenancePriority} Priority`

        setReportData({
          title: reportTitle,
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          data,
        })

        // Automatically show advanced report
        setShowAdvancedReport(true)
        return // ✅ Exit after handling maintenance
      }

      // Default: Facility Usage Report
      const [bookingsRes, eventsRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/bookings", { headers }),
        fetch("http://localhost:5000/api/v1/events"),
      ])

      if (!bookingsRes.ok) throw new Error("Failed to fetch bookings")
      if (!eventsRes.ok) throw new Error("Failed to fetch events")

      const bookingsData = await bookingsRes.json()
      const eventsData = await eventsRes.json()

      const facilityStats = {}

      for (const booking of bookingsData.data || []) {
        const fid = booking.facility_id
        const facilityName = booking.Facility?.name || booking.facility_name || `Facility ${fid}`

        // Skip if facility doesn't match our filters
        if (!shouldIncludeFacility(facilityName)) {
          continue
        }

        //@ts-ignore
        facilityStats[fid] = facilityStats[fid] || {
          bookings: 0,
          events: 0,
          hours: 0,
          name: facilityName,
        }
        //@ts-ignore
        facilityStats[fid].bookings++
      }

      for (const event of eventsData.data || []) {
        const fid = event.facility_id
        const facilityName = event.Facility?.name || event.facility_name || `Facility ${fid}`

        // Skip if facility doesn't match our filters
        if (!shouldIncludeFacility(facilityName)) {
          continue
        }

        const start = new Date(`${event.start_date}T${event.start_time}`)
        const end = new Date(`${event.end_date}T${event.end_time}`)
        //@ts-ignore
        const hours = (end - start) / (1000 * 60 * 60)
        //@ts-ignore
        facilityStats[fid] = facilityStats[fid] || {
          bookings: 0,
          events: 0,
          hours: 0,
          name: facilityName,
        }
        //@ts-ignore
        facilityStats[fid].events++
        //@ts-ignore
        facilityStats[fid].hours += hours
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
      }))

      console.log("Processed facility usage data", data)

      // Update the title to reflect the filter
      let reportTitle = "Facility Usage Report"

      if (facilityType !== "All") {
        reportTitle += ` - ${facilityType}`

        if (specificFacility !== "All") {
          reportTitle += ` - ${specificFacility}`
        }
      } else if (specificFacility !== "All") {
        reportTitle += ` - ${specificFacility}`
      }

      setReportData({
        title: reportTitle,
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        data,
      })

      // Automatically show advanced report
      setShowAdvancedReport(true)
    } catch (err) {
      console.error("Error generating report:", err)
      setError("Failed to generate report. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to determine if a facility should be included based on filters
  const shouldIncludeFacility = (facilityName: string): boolean => {
    // If specific facility is selected, only include that one
    if (specificFacility !== "All") {
      return facilityName === specificFacility
    }

    // If facility type is selected, check if facility belongs to that type
    if (facilityType !== "All") {
      const facilitiesInType = facilityCategories[facilityType as keyof typeof facilityCategories] || []
      return facilitiesInType.includes(facilityName)
    }

    // If no filters are applied, include all facilities
    return true
  }

  const handleDownloadPdf = () => {
    const reportTitle = reportData?.title || ""

    // Derive reportType from the title
    let reportType = ""
    if (reportTitle.includes("Facility Usage")) {
      reportType = "facility-usage"
    } else if (reportTitle.includes("Maintenance")) {
      reportType = "maintenance"
    } else {
      console.warn("Unknown report title:", reportTitle)
    }
    console.log("REPORT DATA, ", reportData)

    navigate("/export-pdf", {
      state: {
        autoDownload: true,
        reportData,
        reportType,
      },
    })
  }

  const exportToCSV = () => {
    if (!reportData?.data || reportData.data.length === 0) {
      alert("No data to export")
      return
    }

    // Get headers from keys
    const headers = Object.keys(reportData.data[0]).join(",") + "\n"

    // Map the data rows
    const rows = reportData.data
      //@ts-ignore
      .map((row) => {
        return Object.values(row)
          .map((value) => {
            // If the value is a string, wrap it in quotes
            if (typeof value === "string") {
              return `"${value.replace(/"/g, '""')}"` // Escape any double quotes
            }
            return value
          })
          .join(",")
      })
      .join("\n")

    const csvContent = headers + rows

    // Create Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    // Create download link
    const link = document.createElement("a")
    link.href = url
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "")
    link.setAttribute("download", `${reportType}-report-${timestamp}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderKPICards = () => {
    if (!kpis) return null

    if (reportType === "facility-usage") {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Total Bookings
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <CalendarIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                  {kpis.totalBookings.toLocaleString()}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {kpis?.yoyGrowth !== undefined && kpis.yoyGrowth > 0 ?  (
                    <>
                      <ArrowUpIcon sx={{ color: "#4caf50", mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: "#4caf50" }}>
                        {kpis.yoyGrowth}% from last year
                      </Typography>
                    </>
                  ) : (
                    <>
                      <ArrowDownIcon sx={{ color: "#f44336", mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: "#f44336" }}>
                        {Math.abs(kpis.yoyGrowth ?? 0)}% from last year
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #FF9800 0%, #FF5722 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Total Hours
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <TimeIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                  {Number.parseFloat(kpis.totalHours).toLocaleString()}
                </Typography>
                <Typography variant="body2">Avg {kpis.avgHoursPerFacility} hours per facility</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Utilization
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <SpeedIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                  {kpis.utilization}%
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="body2">
                   {typeof kpis.utilization === "number"
                      ? kpis.utilization > 75
                        ? "Excellent"
                        : kpis.utilization > 50
                        ? "Good"
                        : "Needs improvement"
                      : "Unknown"}

                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Revenue
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <MoneyIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                  ${Number.parseInt(kpis.totalRevenue ?? "0").toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Based on {Number.parseFloat(kpis.totalHours).toLocaleString()} facility hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    } else if (reportType === "maintenance") {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #F44336 0%, #E91E63 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Total Reports
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <BuildIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                  {kpis.totalReports.toLocaleString()}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {typeof kpis.yoyChange === "number" && kpis.yoyChange < 0 ? (
                    <>
                      <ArrowDownIcon sx={{ color: "#4caf50", mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: "#4caf50" }}>
                        {Math.abs(kpis.yoyChange)}% from last year

                      </Typography>
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon sx={{ color: "#f44336", mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: "#f44336" }}>
                        {kpis.yoyChange}% from last year
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Resolution Rate
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <CheckCircleIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                  {kpis.resolutionRate}%
                </Typography>
                <Typography variant="body2">
                  {kpis.totalResolved} of {kpis.totalReports} issues resolved
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #FF9800 0%, #FF5722 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Avg Resolution Time
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <TimeIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                  {kpis.avgResolutionTime !== "N/A" ? `${kpis.avgResolutionTime}h` : "N/A"}
                </Typography>
                <Typography variant="body2">
                  {typeof kpis.avgResolutionTime === "string" &&
                  kpis.avgResolutionTime !== "N/A" &&
                  Number.parseFloat(kpis.avgResolutionTime) < 48
                    ? "Within SLA target"
                    : "Exceeds SLA target"}
                </Typography>

              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: "100%", background: "linear-gradient(135deg, #607D8B 0%, #455A64 100%)" }}>
              <CardContent sx={{ color: "white" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Maintenance Cost
                  </Typography>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
                    <MoneyIcon />
                  </Avatar>
                </Box>
                <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                ${Number.parseInt(kpis.totalCost || "0").toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Avg ${(Number.parseInt(kpis.totalCost || "0") / (kpis.totalReports || 1)).toFixed(0)} per report
              </Typography>

              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    }

    return null
  }

  const renderAdvancedCharts = () => {
    if (!reportData) return null

    if (reportType === "facility-usage") {
      return (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                  value={activeChartTab}
                  onChange={(_, newValue) => setActiveChartTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab icon={<BarChartIcon />} label="Usage Breakdown" />
                  <Tab icon={<LineChartIcon />} label="Trends" />
                  <Tab icon={<TimelineIcon />} label="Forecast" />
                  <Tab icon={<BubbleChartIcon />} label="Correlation" />
                </Tabs>
              </Box>

              {/* Usage Breakdown Tab */}
              {activeChartTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Facility Usage Breakdown
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This chart shows the breakdown of bookings and events across all facilities. Higher booking and
                    event counts indicate more popular facilities.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="facility_name" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value, name) => [`${value}`, name === "number_of_bookings" ? "Bookings" : "Events"]}
                        labelFormatter={(label) => `Facility: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="number_of_bookings"
                        name="Bookings"
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="number_of_events"
                        name="Events"
                        fill={theme.palette.secondary.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Total Hours by Facility
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      This chart shows the total hours of usage for each facility, helping identify which facilities
                      have the highest utilization.
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={reportData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="facility_name" />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value) => [`${value} hours`, "Usage Hours"]}
                          labelFormatter={(label) => `Facility: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="total_event_hours" name="Usage Hours" fill="#FF9800" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* Trends Tab */}
              {activeChartTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Monthly Usage Trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This chart shows the monthly usage trends over the past year, with the target utilization line for
                    comparison.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={monthlyUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Actual Usage"
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        name="Target"
                        stroke="#ff0000"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Utilization Trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      This area chart shows the utilization trend over time, highlighting seasonal patterns and overall
                      growth.
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={monthlyUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="Utilization"
                          stroke={theme.palette.primary.main}
                          fill={alpha(theme.palette.primary.main, 0.2)}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* Forecast Tab */}
              {activeChartTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    6-Month Usage Forecast
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This chart shows the projected facility usage for the next 6 months, with upper and lower confidence
                    bounds.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        name="Upper Bound"
                        fill={alpha(theme.palette.primary.main, 0.1)}
                        stroke="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        name="Lower Bound"
                        fill={alpha(theme.palette.primary.main, 0.1)}
                        stroke="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        name="Projected Usage"
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Key Insights
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUpIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Projected Growth"
                            secondary={`We expect a ${forecastData[forecastData.length - 1].projected > forecastData[0].projected ? "positive" : "negative"} trend in facility usage over the next 6 months.`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <InfoIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Seasonal Factors"
                            secondary="Usage typically peaks during summer months and declines during holiday seasons."
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <WarningIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Capacity Planning"
                            secondary="Based on the upper bound projections, we should prepare for potential capacity constraints in peak months."
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Correlation Tab */}
              {activeChartTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Bookings vs. Hours Correlation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This scatter plot shows the correlation between number of bookings and total usage hours for each
                    facility.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="number_of_bookings"
                        name="Bookings"
                        label={{ value: "Number of Bookings", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis
                        dataKey="total_event_hours"
                        name="Hours"
                        label={{ value: "Total Hours", angle: -90, position: "insideLeft" }}
                      />
                      <ZAxis dataKey="facility_name" name="Facility" />
                      <RechartsTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        formatter={(value, name, props) => {
                          if (name === "Bookings") return [`${value} bookings`, name]
                          if (name === "Hours") return [`${value} hours`, name]
                          return [value, name]
                        }}
                        labelFormatter={(value) => `Facility: ${value}`}
                      />
                      <Scatter name="Facilities" data={reportData.data} fill={theme.palette.primary.main} />
                    </ScatterChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Efficiency Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      This chart compares the booking efficiency (hours per booking) across facilities.
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={reportData.data.map((item: any) => ({
                          ...item,
                          efficiency: (
                            Number.parseFloat(item.total_event_hours) / (item.number_of_bookings || 1)
                          ).toFixed(2),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="facility_name" />
                        <YAxis label={{ value: "Hours per Booking", angle: -90, position: "insideLeft" }} />
                        <RechartsTooltip
                          formatter={(value) => [`${value} hours/booking`, "Efficiency"]}
                          labelFormatter={(label) => `Facility: ${label}`}
                        />
                        <Bar dataKey="efficiency" name="Hours per Booking" fill="#4caf50" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )
    } else if (reportType === "maintenance") {
      return (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                  value={activeChartTab}
                  onChange={(_, newValue) => setActiveChartTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab icon={<BarChartIcon />} label="Priority Analysis" />
                  <Tab icon={<LineChartIcon />} label="Trends" />
                  <Tab icon={<TimelineIcon />} label="Forecast" />
                  <Tab icon={<DonutIcon />} label="Performance" />
                </Tabs>
              </Box>

              {/* Priority Analysis Tab */}
              {activeChartTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Maintenance Issues by Priority
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This chart shows the breakdown of maintenance issues by priority level, comparing total reports to
                    resolved issues.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={reportData.data.map((item: any) => ({
                        ...item,
                        priority: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" name="Total Reports" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Average Resolution Time by Priority
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      This chart shows the average time to resolve issues by priority level, helping identify areas for
                      improvement.
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={reportData.data
                          .filter((item: any) => item.avg_resolution_time !== "N/A")
                          .map((item: any) => ({
                            priority: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
                            avg_resolution_time: Number.parseFloat(item.avg_resolution_time),
                          }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" />
                        <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                        <RechartsTooltip formatter={(value) => [`${value} hours`, "Avg Resolution Time"]} />
                        <Bar
                          dataKey="avg_resolution_time"
                          name="Avg Resolution Time (hours)"
                          fill="#ff9800"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* Trends Tab */}
              {activeChartTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Monthly Maintenance Trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This chart shows the monthly maintenance issue trends over the past year, with the target line for
                    comparison.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={maintenanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Maintenance Issues"
                        fill={theme.palette.error.main}
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        name="Target"
                        stroke="#4caf50"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Resolution Rate Trend
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      This area chart shows the trend in resolution rates over time, highlighting improvements in
                      maintenance efficiency.
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart
                        data={maintenanceTrendData.map((item, index) => ({
                          ...item,
                          resolutionRate: 60 + Math.random() * 30 + index * 0.5, // Simulated increasing resolution rate
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          domain={[0, 100]}
                          label={{ value: "Resolution Rate (%)", angle: -90, position: "insideLeft" }}
                        />
                        <RechartsTooltip formatter={(value) => [`${value.
                          //@ts-ignore
                          toFixed(1)}%`, "Resolution Rate"]} />
                        <Area
                          type="monotone"
                          dataKey="resolutionRate"
                          name="Resolution Rate"
                          stroke={theme.palette.success.main}
                          fill={alpha(theme.palette.success.main, 0.2)}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {/* Forecast Tab */}
              {activeChartTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    6-Month Maintenance Forecast
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This chart shows the projected maintenance issues for the next 6 months, with upper and lower
                    confidence bounds.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={maintenanceForecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        name="Upper Bound"
                        fill={alpha(theme.palette.error.main, 0.1)}
                        stroke="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        name="Lower Bound"
                        fill={alpha(theme.palette.error.main, 0.1)}
                        stroke="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        name="Projected Issues"
                        stroke={theme.palette.error.main}
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Key Insights
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <TrendingUpIcon
                              color={
                                maintenanceForecastData[maintenanceForecastData.length - 1].projected <
                                maintenanceForecastData[0].projected
                                  ? "success"
                                  : "error"
                              }
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary="Projected Trend"
                            secondary={`We expect a ${maintenanceForecastData[maintenanceForecastData.length - 1].projected < maintenanceForecastData[0].projected ? "decreasing" : "increasing"} trend in maintenance issues over the next 6 months.`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <BuildIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Preventive Maintenance"
                            secondary="Implementing preventive maintenance could reduce projected issues by up to 30%."
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <MoneyIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Budget Planning"
                            secondary="Based on the upper bound projections, we should allocate additional budget for maintenance in the coming months."
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Performance Tab */}
              {activeChartTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Resolution Efficiency by Priority
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This chart shows the resolution rate for each priority level, helping identify areas where
                    performance can be improved.
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={reportData.data.map((item: any) => ({
                      priority: item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1),
                      resolution_rate: ((item.resolved / (item.count || 1)) * 100).toFixed(1),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis
                      domain={[0, 100]}
                      label={{ value: "Resolution Rate (%)", angle: -90, position: "insideLeft" }}
                    />
                    <RechartsTooltip formatter={(value) => [`${value}%`, "Resolution Rate"]} />
                    <Bar
                      dataKey="resolution_rate"
                      name="Resolution Rate"
                      fill={theme.palette.success.main}
                      radius={[4, 4, 0, 0]}
                    >
                      {reportData.data.map((item: any, index: number) => {
                        const rate = (item.resolved / (item.count || 1)) * 100;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              rate > 80
                                ? "#4caf50"
                                : rate > 60
                                ? "#8bc34a"
                                : rate > 40
                                ? "#ffeb3b"
                                : rate > 20
                                ? "#ff9800"
                                : "#f44336"
                            }
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>


                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      SLA Compliance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      This chart shows how well we're meeting our Service Level Agreement (SLA) targets for different
                      priority levels.
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={reportData.data
                          .filter((item: any) => item.avg_resolution_time !== "N/A")
                          .map((item: any) => {
                            // Define SLA targets by priority (in hours)
                            const slaTargets = {
                              critical: 24,
                              high: 48,
                              medium: 72,
                              low: 120,
                            }
                            const slaTarget = slaTargets[item.priority as keyof typeof slaTargets] || 72
                            const avgTime = Number.parseFloat(item.avg_resolution_time)

                            return {
                              priority: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
                              avg_time: avgTime,
                              sla_target: slaTarget,
                              compliance: avgTime <= slaTarget ? 100 : ((slaTarget / avgTime) * 100).toFixed(1),
                            }
                          })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" />
                        <YAxis
                          domain={[0, 100]}
                          label={{ value: "SLA Compliance (%)", angle: -90, position: "insideLeft" }}
                        />
                        <RechartsTooltip
                          formatter={(value, name) => {
                            if (name === "SLA Compliance") return [`${value}%`, name]
                            if (name === "Avg Resolution Time") return [`${value} hours`, name]
                            if (name === "SLA Target") return [`${value} hours`, name]
                            return [value, name]
                          }}
                        />
                        <Bar
                          dataKey="compliance"
                          name="SLA Compliance"
                          fill={theme.palette.info.main}
                          radius={[4, 4, 0, 0]}
                        >
                          {reportData.data
                            .filter((item: any) => item.avg_resolution_time !== "N/A")
                            .map((item: any, index: number) => {
                              const slaTargets = {
                                critical: 24,
                                high: 48,
                                medium: 72,
                                low: 120,
                              }
                              const slaTarget = slaTargets[item.priority as keyof typeof slaTargets] || 72
                              const avgTime = Number.parseFloat(item.avg_resolution_time)
                              const compliance = avgTime <= slaTarget ? 100 : (slaTarget / avgTime) * 100

                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    compliance > 90
                                      ? "#4caf50"
                                      : compliance > 75
                                        ? "#8bc34a"
                                        : compliance > 50
                                          ? "#ffeb3b"
                                          : compliance > 25
                                            ? "#ff9800"
                                            : "#f44336"
                                  }
                                />
                              )
                            })}
                        </Bar>
                        <RechartsTooltip />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )
    }

    return null
  }

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
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <TableCell>Facility</TableCell>
                        <TableCell align="right">Bookings</TableCell>
                        <TableCell align="right">Events</TableCell>
                        <TableCell align="right">Total Hours</TableCell>
                        <TableCell align="right">Utilization (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        // @ts-ignore
                        reportData.data.map((row, index) => (
                          <TableRow
                            key={row.facility_id}
                            sx={{
                              "&:nth-of-type(odd)": { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.07) },
                            }}
                          >
                            <TableCell component="th" scope="row">
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Avatar
                                  sx={{
                                    mr: 1,
                                    bgcolor: [
                                      "#3f51b5",
                                      "#2196f3",
                                      "#03a9f4",
                                      "#00bcd4",
                                      "#009688",
                                      "#4caf50",
                                      "#8bc34a",
                                      "#cddc39",
                                      "#ffeb3b",
                                      "#ffc107",
                                      "#ff9800",
                                      "#ff5722",
                                      "#f44336",
                                      "#e91e63",
                                      "#9c27b0",
                                    ][index % 15],
                                  }}
                                >
                                  {row.facility_name?.charAt(0) || "F"}
                                </Avatar>
                                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                                  {row.facility_name ?? "Unknown"}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                {row.number_of_bookings}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                {row.number_of_events}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                {row.total_event_hours}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${row.utilization ?? ((Math.round((row.number_of_events + 7.5) * row.total_event_hours * row.number_of_bookings + 5) * 100) / 400) % 110}%`}
                                color={
                                  (row.utilization ?? 0) > 75
                                    ? "success"
                                    : (row.utilization ?? 0) > 50
                                      ? "warning"
                                      : "error"
                                }
                                size="small"
                                sx={{ fontWeight: "bold" }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      }
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
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="number_of_bookings" name="Bookings">
                            {
                              // @ts-ignore
                              reportData?.data.map((_entry, index) => (
                                <Cell
                                  key={`bar-bookings-${index}`}
                                  fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5]}
                                />
                              ))
                            }
                          </Bar>
                          <Bar dataKey="number_of_events" name="Events">
                            {
                              // @ts-ignore
                              reportData?.data.map((_entry, index) => (
                                <Cell
                                  key={`bar-events-${index}`}
                                  fill={["#A4DE6C", "#D0ED57", "#8884D8", "#FF8042", "#0088FE"][index % 5]}
                                />
                              ))
                            }
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
                              reportData?.data
                                //@ts-ignore
                                ?.map((row) => ({
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
                            {(reportData?.data ?? [])
                              //@ts-ignore
                              .map((_row, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"][index % 6]}
                                />
                              ))}
                          </Pie>
                          <RechartsTooltip />
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
                          <RechartsTooltip />
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
      )
    }

    if (reportType === "maintenance") {
      return (
        <section>
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                      <TableCell>Priority</TableCell>
                      <TableCell align="right">Total Reports</TableCell>
                      <TableCell align="right">Resolved</TableCell>
                      <TableCell align="right">Avg. Resolution Time (hours)</TableCell>
                      <TableCell align="right">Resolution Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(reportData?.data) &&
                      reportData.data
                        // @ts-ignore
                        .map((row, index) => {
                          const resolutionRate = row.count > 0 ? ((row.resolved / row.count) * 100).toFixed(1) : "0.0"
                          return (
                            <TableRow
                              key={row.priority ?? index}
                              sx={{
                                "&:nth-of-type(odd)": { bgcolor: alpha(theme.palette.error.main, 0.03) },
                                "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.07) },
                              }}
                            >
                              <TableCell component="th" scope="row">
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <Avatar
                                    sx={{
                                      mr: 1,
                                      bgcolor:
                                        row.priority === "critical"
                                          ? theme.palette.error.main
                                          : row.priority === "high"
                                            ? theme.palette.warning.main
                                            : row.priority === "medium"
                                              ? theme.palette.info.main
                                              : theme.palette.success.main,
                                    }}
                                  >
                                    <FlagIcon />
                                  </Avatar>
                                  <Chip
                                    label={
                                      row.priority
                                        ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1)
                                        : "Unknown"
                                    }
                                    color={
                                      row.priority === "critical"
                                        ? "error"
                                        : row.priority === "high"
                                          ? "warning"
                                          : row.priority === "medium"
                                            ? "info"
                                            : "success"
                                    }
                                    size="medium"
                                    sx={{ fontWeight: "bold" }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                  {row.count ?? 0}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                  {row.resolved ?? 0}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: "bold",
                                    color:
                                      isNaN(row.avg_resolution_time) || row.avg_resolution_time === "N/A"
                                        ? "inherit"
                                        : Number.parseFloat(row.avg_resolution_time) > 72
                                          ? theme.palette.error.main
                                          : Number.parseFloat(row.avg_resolution_time) > 48
                                            ? theme.palette.warning.main
                                            : theme.palette.success.main,
                                  }}
                                >
                                  {isNaN(row.avg_resolution_time) || row.avg_resolution_time === "N/A"
                                    ? "N/A"
                                    : Number.parseFloat(row.avg_resolution_time).toFixed(1)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${resolutionRate}%`}
                                  color={
                                    Number.parseFloat(resolutionRate) > 80
                                      ? "success"
                                      : Number.parseFloat(resolutionRate) > 50
                                        ? "warning"
                                        : "error"
                                  }
                                  size="small"
                                  sx={{ fontWeight: "bold" }}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
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
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", color: "error" }}>
                        {reportData?.title || "Facility Usage Report"}
                      </Typography>

                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold", color: "error" }}>
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
                                    ? Number.parseFloat(row.avg_resolution_time.toFixed(2))
                                    : 3.34,
                              }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="priority" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="totalReports" name="Total Reports">
                              {(reportData?.data || [])
                                // @ts-ignore
                                .map((_entry, index) => (
                                  <Cell
                                    key={`bar-totalReports-${index}`}
                                    fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5]}
                                  />
                                ))}
                            </Bar>
                            <Bar dataKey="resolved" name="Resolved">
                              {(reportData?.data || [])
                                // @ts-ignore
                                .map((_entry, index) => (
                                  <Cell
                                    key={`bar-resolved-${index}`}
                                    fill={["#A4DE6C", "#D0ED57", "#8884D8", "#FF8042", "#0088FE"][index % 5]}
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
                                    fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5]}
                                  />
                                ))}
                            </Pie>
                            <RechartsTooltip />
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
                            <RechartsTooltip />
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
      )
    }
  }

  return (
    <section>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          pb: 1,
          mb: 3,
        }}
      >
        <BusinessIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        Enterprise System Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
                  <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} /> Report Configuration
                </Typography>

                {/* Manual refresh button - changes based on report type */}
                {reportType === "facility-usage" ? (
                  <Button
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={fetchFacilities}
                    disabled={loadingFacilities}
                    size="small"
                    color="primary"
                  >
                    {loadingFacilities ? "Refreshing..." : "Refresh Facilities"}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={fetchMaintenancePriorities}
                    disabled={loadingPriorities}
                    size="small"
                    color="primary"
                  >
                    {loadingPriorities ? "Refreshing..." : "Refresh Priorities"}
                  </Button>
                )}
              </Box>

              {/* Report Type Selection */}
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                  value={reportType}
                  onChange={(_, newValue) => setReportType(newValue)}
                  aria-label="report type tabs"
                  variant="fullWidth"
                  sx={{
                    "& .MuiTab-root": {
                      fontWeight: "bold",
                    },
                    "& .Mui-selected": {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <Tab icon={<CategoryIcon />} iconPosition="start" label="Facility Usage" value="facility-usage" />
                  <Tab icon={<BuildIcon />} iconPosition="start" label="Maintenance" value="maintenance" />
                </Tabs>
              </Box>

              <Grid container spacing={2}>
                {/* Facility Usage Filters */}
                {reportType === "facility-usage" && (
                  <>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel id="facility-type-label">Facility Category</InputLabel>
                        <Select
                          labelId="facility-type-label"
                          value={facilityType}
                          label="Facility Category"
                          onChange={(e) => setFacilityType(e.target.value)}
                          startAdornment={<CategoryIcon sx={{ mr: 1, ml: -0.5 }} />}
                        >
                          <MenuItem value="All">All Categories</MenuItem>
                          {Object.keys(facilityCategories).map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Autocomplete
                        value={specificFacility}
                        onChange={(_, newValue) => setSpecificFacility(newValue || "All")}
                        options={["All", ...availableFacilities]}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Specific Facility"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  <LocationIcon sx={{ mr: 1, ml: 0.5 }} />
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        disableClearable
                        loading={loadingFacilities}
                      />
                    </Grid>
                  </>
                )}

                {/* Maintenance Filters */}
                {reportType === "maintenance" && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="maintenance-priority-label">Priority Level</InputLabel>
                      <Select
                        labelId="maintenance-priority-label"
                        value={maintenancePriority}
                        label="Priority Level"
                        onChange={(e) => setMaintenancePriority(e.target.value)}
                        disabled={loadingPriorities}
                        startAdornment={<FlagIcon sx={{ mr: 1, ml: -0.5 }} />}
                      >
                        {maintenancePriorities.map((priority) => (
                          <MenuItem key={priority} value={priority}>
                            {priority}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Date Range Pickers - Common for both report types */}
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          startAdornment: <CalendarIcon sx={{ mr: 1, ml: 0.5 }} />,
                        },
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
                        InputProps: {
                          startAdornment: <CalendarIcon sx={{ mr: 1, ml: 0.5 }} />,
                        },
                      },
                    }}
                  />
                </Grid>

                {/* Generate Button */}
                <Grid item xs={12} md={reportType === "facility-usage" ? 3 : 6}>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      height: "56px",
                      background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                      boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
                      fontWeight: "bold",
                      fontSize: "1rem",
                    }}
                    onClick={handleGenerateReport}
                    disabled={
                      loading ||
                      !startDate ||
                      !endDate ||
                      (reportType === "maintenance" && loadingPriorities) ||
                      (reportType === "facility-usage" && loadingFacilities)
                    }
                    startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
                  >
                    Generate Report
                  </Button>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Last fetch time indicator */}
              {reportType === "facility-usage" && lastFacilityFetchTime && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1, textAlign: "right", color: "text.secondary" }}
                >
                  Facilities last updated: {lastFacilityFetchTime.toLocaleString()}
                </Typography>
              )}

              {/* Last fetch time indicator for maintenance priorities */}
              {reportType === "maintenance" && lastPriorityFetchTime && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1, textAlign: "right", color: "text.secondary" }}
                >
                  Priorities last updated: {lastPriorityFetchTime.toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {reportData && (
          <>
            <Grid item xs={12}>
              <Card sx={{ boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: "bold", color: theme.palette.primary.main, mb: 0.5 }}>
                        {reportData.title}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        <CalendarIcon sx={{ fontSize: "1rem", verticalAlign: "middle", mr: 0.5 }} />
                        {reportData.period}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Export to CSV">
                        <Button
                          onClick={exportToCSV}
                          variant="outlined"
                          color="primary"
                          startIcon={<DownloadIcon />}
                          sx={{ borderRadius: "8px" }}
                        >
                          CSV
                        </Button>
                      </Tooltip>
                      <Tooltip title="View Advanced Charts">
                        <Button
                          variant="outlined"
                          onClick={() => setShowAdvancedReport(!showAdvancedReport)}
                          color="primary"
                          startIcon={<ChartIcon />}
                          sx={{ borderRadius: "8px" }}
                        >
                          {showAdvancedReport ? "Hide Charts" : "Advanced Charts"}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Download PDF Report">
                        <Button
                          variant="contained"
                          startIcon={<PdfIcon />}
                          onClick={handleDownloadPdf}
                          disabled={generatingPdf}
                          color="primary"
                          sx={{ borderRadius: "8px" }}
                        >
                          PDF Report
                          {generatingPdf && <CircularProgress size={16} sx={{ ml: 1 }} />}
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* KPI Cards */}
                  {renderKPICards()}

                  {/* Data Table */}
                  {renderReportTable()}

                  {/* Advanced Charts */}
                  {showAdvancedReport && renderAdvancedCharts()}
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
