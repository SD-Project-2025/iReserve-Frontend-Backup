"use client"

import { useRef, useState, useEffect } from "react"
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
} from "@mui/material"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Chart from "chart.js/auto"
import DownloadIcon from "@mui/icons-material/Download"
import BarChartIcon from "@mui/icons-material/BarChart"
import AssessmentIcon from "@mui/icons-material/Assessment"
import { useLocation } from "react-router-dom"
import type { FC } from "react"

// Register Chart.js plugins for better visuals
import ChartDataLabels from "chartjs-plugin-datalabels"
Chart.register(ChartDataLabels)

let chartInstances: Chart[] = []

const ExportPdfPage: FC = () => {
  const location = useLocation()
  const { reportData, autoDownload, reportType } = location.state || {}
  const reportRef = useRef(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const chartRenderTarget = 3 // Charts rendered based on report type
  let chartRenderCounter = 0

  const onChartRendered = () => {
    chartRenderCounter++
    if (chartRenderCounter >= chartRenderTarget) {
      setChartsReady(true)
    }
  }

  useEffect(() => {
    if (reportData?.data?.length && reportType) {
      generateCharts()
    }
  }, [reportData, reportType])

  useEffect(() => {
    if (autoDownload && chartsReady && !generatingPdf && !hasDownloaded) {
      setHasDownloaded(true)
      handleDownloadPdf()
    }
  }, [autoDownload, chartsReady, generatingPdf, hasDownloaded])

  // Get current date for report
  const getCurrentDate = () => {
    const date = new Date()
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate summary statistics for the report
  const calculateSummary = () => {
    if (!reportData?.data?.length) return null

    if (reportType === "facility-usage") {
      const totalBookings = reportData.data.reduce((sum: number, item: any) => sum + (item.number_of_bookings || 0), 0)
      const totalEvents = reportData.data.reduce((sum: number, item: any) => sum + (item.number_of_events || 0), 0)
      const totalHours = reportData.data.reduce((sum: number, item: any) => sum + (item.total_event_hours || 0), 0)
      const avgUtilization =
        reportData.data.reduce((sum: number, item: any) => {
          const utilization =
            item.utilization ||
            Math.round(
              ((((item.number_of_events || 0) + 7.5) * (item.total_event_hours || 0) * (item.number_of_bookings || 0) +
                5) *
                100) /
                400,
            )
          return sum + utilization
        }, 0) / reportData.data.length

      return {
        totalBookings,
        totalEvents,
        totalHours: Math.round(totalHours),
        avgUtilization: Math.round(avgUtilization),
      }
    }

    if (reportType === "maintenance") {
      const totalReports = reportData.data.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
      const totalResolved = reportData.data.reduce((sum: number, item: any) => sum + (item.resolved || 0), 0)
      const avgResolutionTime =
        reportData.data.reduce((sum: number, item: any) => sum + (item.avg_resolution_time || 0), 0) /
        reportData.data.length

      return {
        totalReports,
        totalResolved,
        resolutionRate: Math.round((totalResolved / totalReports) * 100),
        avgResolutionTime: Math.round(avgResolutionTime / 36),
      }
    }

    return null
  }

  const generateCharts = () => {
    // Destroy previous charts
    chartInstances.forEach((chart) => chart.destroy())
    chartInstances = []

    const ctx1 = document.getElementById("chart1") as HTMLCanvasElement
    const ctx2 = document.getElementById("chart2") as HTMLCanvasElement
    const ctx3 = document.getElementById("chart3") as HTMLCanvasElement

    if (!ctx1 || !ctx2 || !ctx3) return

    if (reportType === "facility-usage") {
      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          onComplete: onChartRendered,
        },
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              font: {
                size: 12,
                weight: "bold",
              },
            },
          },
          title: {
            display: true,
            font: {
              size: 16,
              weight: "bold",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          datalabels: {
            color: "#fff",
            font: {
              weight: "bold",
            },
            formatter: (value: number) => {
              return value > 0 ? value : ""
            },
          },
        },
      }

      const fixedWidth = 500
      const fixedHeight = 300

      ctx1.width = fixedWidth
      ctx1.height = fixedHeight

      ctx2.width = fixedWidth
      ctx2.height = fixedHeight

      ctx3.width = fixedWidth
      ctx3.height = fixedHeight

      const bookingsChart = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: reportData.data.map((d: any) => d.facility_name),
          datasets: [
            {
              label: "Bookings",
              data: reportData.data.map((d: any) => d.number_of_bookings),
              backgroundColor: [
                "rgba(54, 162, 235, 0.8)",
                "rgba(75, 192, 192, 0.8)",
                "rgba(153, 102, 255, 0.8)",
                "rgba(255, 159, 64, 0.8)",
                "rgba(255, 99, 132, 0.8)",
              ],
              borderColor: [
                "rgb(54, 162, 235)",
                "rgb(75, 192, 192)",
                "rgb(153, 102, 255)",
                "rgb(255, 159, 64)",
                "rgb(255, 99, 132)",
              ],
              borderWidth: 1,
              borderRadius: 5,
            },
            {
              label: "Events",
              data: reportData.data.map((d: any) => d.number_of_events),
              backgroundColor: [
                "rgba(255, 206, 86, 0.8)",
                "rgba(75, 192, 192, 0.8)",
                "rgba(153, 102, 255, 0.8)",
                "rgba(255, 159, 64, 0.8)",
                "rgba(255, 99, 132, 0.8)",
              ],
              borderColor: [
                "rgb(255, 206, 86)",
                "rgb(75, 192, 192)",
                "rgb(153, 102, 255)",
                "rgb(255, 159, 64)",
                "rgb(255, 99, 132)",
              ],
              borderWidth: 1,
              borderRadius: 5,
            },
          ],
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            //@ts-ignore
            title: {
              ...commonOptions.plugins.title,
              text: "Facility Bookings & Events",
            },
            //@ts-ignore
            datalabels: {
              ...commonOptions.plugins.datalabels,
              anchor: "end",
              align: "top",
              color: "#000",
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45,
                font: {
                  weight: "bold",
                },
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
              ticks: {
                font: {
                  weight: "bold",
                },
              },
            },
          },
        },
      })

      const hoursChart = new Chart(ctx2, {
        type: "line",
        data: {
          labels: reportData.data.map((d: any) => d.facility_name),
          datasets: [
            {
              label: "Bookings",
              data: reportData.data.map((d: any) => d.number_of_bookings),
              borderColor: "rgba(54, 162, 235, 1)",
              backgroundColor: "rgba(54, 162, 235, 0.1)",
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 6,
              pointBackgroundColor: "rgba(54, 162, 235, 1)",
              pointHoverRadius: 8,
              pointHoverBackgroundColor: "rgba(54, 162, 235, 1)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
            {
              label: "Events",
              data: reportData.data.map((d: any) => d.number_of_events),
              borderColor: "rgba(255, 99, 132, 1)",
              backgroundColor: "rgba(255, 99, 132, 0.1)",
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 6,
              pointBackgroundColor: "rgba(255, 99, 132, 1)",
              pointHoverRadius: 8,
              pointHoverBackgroundColor: "rgba(255, 99, 132, 1)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            //@ts-ignore
            title: {
              ...commonOptions.plugins.title,
              text: "Facility Usage Trends",
            },
            datalabels: {
              display: false,
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45,
                font: {
                  weight: "bold",
                },
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
              ticks: {
                font: {
                  weight: "bold",
                },
              },
            },
          },
        },
      })

      // Create a pie chart similar to the example image
      const pieChart = new Chart(ctx3, {
        type: "pie",
        data: {
          labels: reportData.data.map((d: any) => d.facility_name),
          datasets: [
            {
              label: "Events",
              data: reportData.data.map((d: any) => d.number_of_events),
              backgroundColor: [
                "rgba(54, 162, 235, 0.8)", // Blue
                "rgba(255, 99, 132, 0.8)", // Red/Pink
                "rgba(255, 206, 86, 0.8)", // Yellow
                "rgba(153, 102, 255, 0.8)", // Purple
                "rgba(75, 192, 192, 0.8)", // Teal
                "rgba(255, 159, 64, 0.8)", // Orange
              ],
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: 30,
          },
          plugins: {
            title: {
              display: true,
              text: "Events Distribution by Facility",
              font: {
                size: 18,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 30,
              },
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  let label = tooltipItem.label || ""
                  if (label) label += ": "
                  const total = reportData.data.reduce((sum: number, item: any) => sum + item.number_of_events, 0)
                  label += `${tooltipItem.raw} events (${(((tooltipItem.raw as number) / total) * 100).toFixed(1)}%)`
                  return label
                },
              },
            },
            legend: {
              position: "right",
              align: "center",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20,
                font: {
                  size: 12,
                  weight: "bold",
                },
              },
            },
            //@ts-ignore
            datalabels: {
              color: "#ffffff",
              font: {
                size: 16,
                weight: "bold",
              },
              formatter: (value: number, context: any) => {
                const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0)
                const percentage = ((value / total) * 100).toFixed(0)
                return `${percentage}%`
              },
              anchor: "center",
              align: "center",
              offset: 0,
            },
          },
        },
      })

      chartInstances.push(bookingsChart, hoursChart, pieChart)
    }

    if (reportType === "maintenance") {
      const processedData = (reportData?.data || []).map((row: any) => ({
        priority: row.priority ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1) : "Unknown",
        totalReports: row.count ?? 0,
        resolved: row.resolved ?? 0,
        avgResolutionTime:
          typeof row.avg_resolution_time === "number" ? Number.parseFloat(row.avg_resolution_time.toFixed(2)) : 3.34,
      }))

      const barChart = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: processedData.map((d: any) => d.priority),
          datasets: [
            {
              label: "Total Reports",
              data: processedData.map((d: any) => d.totalReports),
              backgroundColor: [
                "rgba(255, 99, 132, 0.8)",
                "rgba(54, 162, 235, 0.8)",
                "rgba(255, 206, 86, 0.8)",
                "rgba(75, 192, 192, 0.8)",
                "rgba(153, 102, 255, 0.8)",
              ],
              borderColor: [
                "rgb(255, 99, 132)",
                "rgb(54, 162, 235)",
                "rgb(255, 206, 86)",
                "rgb(75, 192, 192)",
                "rgb(153, 102, 255)",
              ],
              borderWidth: 1,
              borderRadius: 5,
            },
            {
              label: "Resolved",
              data: processedData.map((d: any) => d.resolved),
              backgroundColor: [
                "rgba(75, 192, 192, 0.8)",
                "rgba(153, 102, 255, 0.8)",
                "rgba(255, 159, 64, 0.8)",
                "rgba(255, 99, 132, 0.8)",
                "rgba(54, 162, 235, 0.8)",
              ],
              borderColor: [
                "rgb(75, 192, 192)",
                "rgb(153, 102, 255)",
                "rgb(255, 159, 64)",
                "rgb(255, 99, 132)",
                "rgb(54, 162, 235)",
              ],
              borderWidth: 1,
              borderRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            onComplete: onChartRendered,
          },
          plugins: {
            title: {
              display: true,
              text: "Maintenance Report by Priority",
              font: {
                size: 18,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
            legend: {
              display: true,
              position: "top",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20,
                font: {
                  size: 12,
                  weight: "bold",
                },
              },
            },
            //@ts-ignore
            datalabels: {
              color: "#fff",
              font: {
                weight: "bold",
              },
              anchor: "center",
              align: "center",
              formatter: (value: number) => {
                return value > 0 ? value : ""
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              title: {
                display: true,
                text: "Priority",
                font: {
                  weight: "bold",
                  size: 14,
                },
              },
              ticks: {
                font: {
                  weight: "bold",
                },
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
              title: {
                display: true,
                text: "Report Count",
                font: {
                  weight: "bold",
                  size: 14,
                },
              },
              ticks: {
                font: {
                  weight: "bold",
                },
              },
            },
          },
        },
      })

      const lineChart = new Chart(ctx2, {
        type: "line",
        data: {
          labels: reportData.data.map((d: any) => d.priority),
          datasets: [
            {
              label: "Avg. Resolution Time (hrs)",
              data: reportData.data.map((d: any) => d.avg_resolution_time),
              borderColor: "rgba(54, 162, 235, 1)",
              backgroundColor: "rgba(54, 162, 235, 0.1)",
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 6,
              pointBackgroundColor: "rgba(54, 162, 235, 1)",
              pointHoverRadius: 8,
              pointHoverBackgroundColor: "rgba(54, 162, 235, 1)",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            onComplete: onChartRendered,
          },
          plugins: {
            title: {
              display: true,
              text: "Average Resolution Time by Priority",
              font: {
                size: 18,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
            legend: {
              display: true,
              position: "top",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20,
                font: {
                  size: 12,
                  weight: "bold",
                },
              },
            },
            //@ts-ignore
            datalabels: {
              display: false,
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                font: {
                  weight: "bold",
                },
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(0, 0, 0, 0.1)",
              },
              ticks: {
                font: {
                  weight: "bold",
                },
              },
            },
          },
        },
      })

      // Create a pie chart similar to the example image
      const pieChart = new Chart(ctx3, {
        type: "pie",
        data: {
          labels: reportData.data.map((d: any) =>
            d.priority ? d.priority.charAt(0).toUpperCase() + d.priority.slice(1) : "Unknown",
          ),
          datasets: [
            {
              label: "Total Reports",
              data: reportData.data.map((d: any) => d.count ?? 0),
              backgroundColor: [
                "rgba(54, 162, 235, 0.8)", // Blue
                "rgba(255, 99, 132, 0.8)", // Red/Pink
                "rgba(255, 206, 86, 0.8)", // Yellow
                "rgba(153, 102, 255, 0.8)", // Purple
                "rgba(75, 192, 192, 0.8)", // Teal
              ],
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: 30,
          },
          plugins: {
            title: {
              display: true,
              text: "Maintenance Reports by Priority",
              font: {
                size: 18,
                weight: "bold",
              },
              padding: {
                top: 10,
                bottom: 30,
              },
            },
            legend: {
              position: "right",
              align: "center",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20,
                font: {
                  size: 12,
                  weight: "bold",
                },
              },
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  let label = tooltipItem.label || ""
                  if (label) label += ": "
                  const total = reportData.data.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
                  label += `${tooltipItem.raw} reports (${(((tooltipItem.raw as number) / total) * 100).toFixed(1)}%)`
                  return label
                },
              },
            },
            //@ts-ignore
            datalabels: {
              color: "#ffffff",
              font: {
                size: 16,
                weight: "bold",
              },
              formatter: (value: number, context: any) => {
                const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0)
                const percentage = ((value / total) * 100).toFixed(0)
                return `${percentage}%`
              },
              anchor: "center",
              align: "center",
              offset: 0,
            },
          },
        },
      })

      chartInstances.push(barChart, lineChart, pieChart)
    }
  }

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return
    setGeneratingPdf(true)
    console.log("REPORT DATA is here: , ", reportData)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${reportData?.title || "iReserve_Report"}.pdf`)
    } catch (err) {
      console.error("PDF generation failed:", err)
    }
    setGeneratingPdf(false)
  }

  const renderTable = () => {
    if (reportType === "facility-usage") {
      return (
        <TableContainer
          component={Paper}
          sx={{
            breakInside: "avoid",
            pageBreakInside: "avoid",
            overflowX: "auto",
            marginTop: 3,
            marginBottom: 3,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        >
          <Table
            size="small"
            sx={{
              tableLayout: "fixed",
              width: "100%",
              pageBreakInside: "auto",
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>Facility</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  Bookings
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  Events
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  Total Hours
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  Utilization (%)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((row: any) => {
                const calculatedUtilization = Math.min(
                  row.utilization ??
                    Math.round(
                      ((((row.number_of_events ?? 0) + 7.5) *
                        (row.total_event_hours ?? 0) *
                        (row.number_of_bookings ?? 0) +
                        5) *
                        100) /
                        400,
                    ),
                  98,
                )

                const bgColor =
                  calculatedUtilization > 75
                    ? "success.main"
                    : calculatedUtilization > 50
                      ? "warning.main"
                      : "error.main"

                return (
                  <TableRow
                    key={row.facility_id}
                    sx={{
                      pageBreakInside: "avoid",
                      breakInside: "avoid",
                      "&:nth-of-type(even)": { backgroundColor: "#f9f9f9" },
                      "&:hover": { backgroundColor: "#f0f7ff" },
                    }}
                  >
                    <TableCell component="th" scope="row" sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
                      {row.facility_name ?? "Unknown"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.85rem" }}>
                      {row.number_of_bookings}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.85rem" }}>
                      {row.number_of_events}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.85rem" }}>
                      {Math.round(row.total_event_hours)}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "16px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "white",
                          backgroundColor: bgColor,
                        }}
                      >
                        {`${calculatedUtilization}%`}
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    if (reportType === "maintenance") {
      return (
        <TableContainer
          component={Paper}
          sx={{
            width: "100%",
            overflowX: "auto",
            pageBreakInside: "avoid",
            breakInside: "avoid",
            marginTop: 3,
            marginBottom: 3,
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        >
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>Priority</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  Total Reports
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                  Resolved
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "normal", fontWeight: "bold", fontSize: "0.85rem" }}>
                  Avg. Resolution
                  <br />
                  Time (hrs)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData?.data?.map((row: any, idx: number) => (
                <TableRow
                  key={idx}
                  sx={{
                    "&:nth-of-type(even)": { backgroundColor: "#f9f9f9" },
                    "&:hover": { backgroundColor: "#f0f7ff" },
                  }}
                >
                  <TableCell sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{row.priority}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.85rem" }}>
                    {row.count}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.85rem" }}>
                    {row.resolved}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.85rem" }}>
                    {Math.round(row.avg_resolution_time / 36)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    return null
  }

  // Get summary data
  const summaryData = calculateSummary()

  const renderReportContent = () => (
    <Box p={3}>
      {!autoDownload && (
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadPdf}
          disabled={generatingPdf}
          sx={{
            backgroundColor: "#4CAF50",
            "&:hover": {
              backgroundColor: "#388E3C",
            },
            mb: 2,
          }}
        >
          {generatingPdf ? <CircularProgress size={24} color="inherit" /> : "Download PDF Report"}
        </Button>
      )}

      <Box
        ref={reportRef}
        sx={{
          position: "absolute",
          left: "-9999px",
          width: "800px",
          bgcolor: "white",
          p: 4,
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        }}
      >
        {/* Header with Logo and Company Info */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            pb: 2,
            borderBottom: "2px solid #4CAF50",
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#4CAF50" }}>
              iReserve
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Facility Management System
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Report Generated: {getCurrentDate()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Document ID: IR-{Math.floor(Math.random() * 10000)}-{new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>

        {/* Report Title & Period */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#4CAF50", mb: 1 }}>
            {reportData?.title || "Facility Usage Report"}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "#666" }}>
            {reportData?.period || ""}
          </Typography>
        </Box>

        {/* Executive Summary */}
        <Box
          sx={{
            mb: 4,
            p: 2,
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#333" }}>
            Executive Summary
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
            This report provides a comprehensive analysis of{" "}
            {reportType === "facility-usage" ? "facility usage" : "maintenance activities"}
            within the iReserve system. The data presented covers {reportData?.period || "the current period"} and
            highlights key metrics and trends to support decision-making and resource allocation.
          </Typography>

          {summaryData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {reportType === "facility-usage" ? (
                <>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#e3f2fd", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                          {summaryData.totalBookings}
                        </Typography>
                        <Typography variant="body2">Total Bookings</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#e8f5e9", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#4caf50" }}>
                          {summaryData.totalEvents}
                        </Typography>
                        <Typography variant="body2">Total Events</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#fff8e1", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ff9800" }}>
                          {summaryData.totalHours}
                        </Typography>
                        <Typography variant="body2">Total Hours</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#fce4ec", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#e91e63" }}>
                          {summaryData.avgUtilization}%
                        </Typography>
                        <Typography variant="body2">Avg Utilization</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#e3f2fd", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                          {summaryData.totalReports}
                        </Typography>
                        <Typography variant="body2">Total Reports</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#e8f5e9", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#4caf50" }}>
                          {summaryData.totalResolved}
                        </Typography>
                        <Typography variant="body2">Resolved</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#fff8e1", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ff9800" }}>
                          {summaryData.resolutionRate}%
                        </Typography>
                        <Typography variant="body2">Resolution Rate</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ backgroundColor: "#fce4ec", height: "100%" }}>
                      <CardContent sx={{ textAlign: "center", p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#e91e63" }}>
                          {summaryData.avgResolutionTime}h
                        </Typography>
                        <Typography variant="body2">Avg Resolution</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </Box>

        {/* Detailed Data Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", mb: 2, color: "#333", display: "flex", alignItems: "center" }}
          >
            <AssessmentIcon sx={{ mr: 1 }} />
            Detailed {reportType === "facility-usage" ? "Facility Usage" : "Maintenance"} Data
          </Typography>
          {renderTable()}
        </Box>

        {/* Visual Analysis Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", mb: 2, color: "#333", display: "flex", alignItems: "center" }}
          >
            <BarChartIcon sx={{ mr: 1 }} />
            Visual Analysis
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            The charts below provide a visual representation of the key metrics and trends identified in the data. These
            visualizations help to identify patterns and insights that may not be immediately apparent from the raw
            data.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* First row of charts */}
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", mb: 4 }}>
            <Box sx={{ width: "48%", height: "300px", position: "relative" }}>
              <canvas id="chart1" />
            </Box>
            <Box sx={{ width: "48%", height: "300px", position: "relative" }}>
              <canvas id="chart2" />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Pie chart with more space */}
          <Box sx={{ width: "100%", height: "400px", position: "relative", mb: 4 }}>
            <canvas id="chart3" />
          </Box>
        </Box>

        {/* Conclusions Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#333" }}>
            Conclusions & Recommendations
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
            Based on the analysis of the data presented in this report, the following conclusions and recommendations
            can be made:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            {reportType === "facility-usage" ? (
              <>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Facilities with utilization rates below 50% should be evaluated for potential repurposing or marketing
                  efforts.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  High-demand facilities (utilization &gt; 75%) may benefit from expanded capacity or similar
                  facilities.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Consider adjusting booking policies to optimize usage patterns and increase overall utilization.
                </Typography>
              </>
            ) : (
              <>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Priority should be given to addressing maintenance issues with longer resolution times.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Consider allocating additional resources to areas with high report volumes.
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Implement preventative maintenance schedules for frequently reported issues.
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 6, pt: 2, borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} iReserve Facility Management System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Page 1 of 1
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return renderReportContent()
}

export default ExportPdfPage
