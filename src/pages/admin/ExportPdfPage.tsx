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
  Alert,
} from "@mui/material"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Chart from "chart.js/auto"
import PdfIcon from "@mui/icons-material/PictureAsPdf"
import { useLocation, useNavigate } from "react-router-dom"
import type { FC } from "react"

let chartInstances: Chart[] = []

const ExportPdfPage: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Get report data from sessionStorage if not in location state
  const storedData = sessionStorage.getItem("pdfReportData")
  const parsedData = storedData ? JSON.parse(storedData) : null

  const { reportData, autoDownload, reportType } = location.state || parsedData || {}

  const reportRef = useRef<HTMLDivElement>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine how many charts to render based on report type
  const chartRenderTarget = reportType === "maintenance" ? 3 : 3
  let chartRenderCounter = 0

  const onChartRendered = () => {
    chartRenderCounter++
    if (chartRenderCounter >= chartRenderTarget) {
      setChartsReady(true)
    }
  }

  useEffect(() => {
    // Clear stored data after use
    if (parsedData) {
      sessionStorage.removeItem("pdfReportData")
    }

    if (reportData?.data?.length && reportType) {
      generateCharts()
    } else if (!reportData) {
      setError("No report data available. Please generate a report first.")
    }
  }, [reportData, reportType])

  useEffect(() => {
    if (autoDownload && chartsReady && !generatingPdf && !hasDownloaded) {
      setHasDownloaded(true)
      handleDownloadPdf()
    }
  }, [autoDownload, chartsReady, generatingPdf, hasDownloaded])

  const generateCharts = () => {
    // Destroy previous charts
    chartInstances.forEach((chart) => chart.destroy())
    chartInstances = []

    const ctx1 = document.getElementById("chart1") as HTMLCanvasElement
    const ctx2 = document.getElementById("chart2") as HTMLCanvasElement
    const ctx3 = document.getElementById("chart3") as HTMLCanvasElement

    if (!ctx1 || !ctx2 || !ctx3) {
      console.error("Chart canvas elements not found")
      return
    }

    if (reportType === "facility-usage") {
      const commonOptions = {
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          onComplete: onChartRendered,
        },
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              color: "#000000",
              font: {
                size: 12,
              },
            },
          },
          title: {
            display: true,
            font: { size: 16, weight: "bold" as const },
          },
        },
      }

      const fixedWidth = 500
      const fixedHeight = 300

      // Set canvas dimensions and styles
      ctx1.width = fixedWidth
      ctx1.height = fixedHeight
      ctx1.style.pageBreakBefore = "always"
      ctx1.style.breakBefore = "page"
      ctx1.style.marginTop = "20px"

      ctx2.width = fixedWidth
      ctx2.height = fixedHeight
      ctx2.style.pageBreakBefore = "always"
      ctx2.style.breakBefore = "page"
      ctx2.style.marginTop = "20px"

      ctx3.width = fixedWidth
      ctx3.height = fixedHeight
      ctx3.style.pageBreakBefore = "always"
      ctx3.style.breakBefore = "page"
      ctx3.style.marginTop = "20px"

      const bookingsChart = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: reportData.data.map((d: any) => d.facility_name),
          datasets: [
            {
              label: "Bookings",
              data: reportData.data.map((d: any) => d.number_of_bookings),
              backgroundColor: reportData.data.map(
                (_entry: any, index: number) => ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5],
              ),
            },
            {
              label: "Events",
              data: reportData.data.map((d: any) => d.number_of_events),
              backgroundColor: reportData.data.map(
                (_entry: any, index: number) => ["#A4DE6C", "#D0ED57", "#8884D8", "#FF8042", "#0088FE"][index % 5],
              ),
            },
          ],
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            title: {
              ...commonOptions.plugins.title,
              text: "Facility Bookings and Events",
            },
          },
          scales: {
            x: {
              ticks: {
                autoSkip: true,
                maxRotation: 45,
                minRotation: 45,
              },
            },
            y: {
              beginAtZero: true,
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
              borderColor: "#36A2EB",
              fill: false,
              tension: 0.3,
              borderWidth: 3,
              pointRadius: 6,
              pointBackgroundColor: "#36A2EB",
              pointHoverRadius: 8,
              pointHoverBackgroundColor: "#36A2EB",
            },
            {
              label: "Events",
              data: reportData.data.map((d: any) => d.number_of_events),
              borderColor: "#FF6384",
              fill: false,
              tension: 0.3,
              borderWidth: 3,
              pointRadius: 6,
              pointBackgroundColor: "#FF6384",
              pointHoverRadius: 8,
              pointHoverBackgroundColor: "#FF6384",
            },
          ],
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            title: {
              ...commonOptions.plugins.title,
              text: "Facility Activity Trends",
            },
          },
          scales: {
            x: {
              ticks: {
                autoSkip: true,
                maxRotation: 45,
                minRotation: 45,
              },
            },
            y: {
              beginAtZero: true,
            },
          },
        },
      })

      const pieChart = new Chart(ctx3, {
        type: "pie",
        data: {
          labels: reportData.data.map((d: any) => d.facility_name),
          datasets: [
            {
              label: "Events",
              data: reportData.data.map((d: any) => d.number_of_events),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
                "#FFB6C1",
                "#00E676",
                "#673AB7",
                "#FF5722",
              ],
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            onComplete: onChartRendered,
          },
          plugins: {
            title: {
              display: true,
              text: "Events Distribution by Facility",
              font: { size: 16, weight: "bold" as const },
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  let label = tooltipItem.label || ""
                  if (label) label += ": "
                  const total = reportData.data.reduce(
                    (sum: number, item: any) => sum + (item.number_of_events || 0),
                    0,
                  )
                  label += `${tooltipItem.raw} events (${(((tooltipItem.raw as number) / total) * 100).toFixed(1)}%)`
                  return label
                },
              },
            },
            legend: {
              position: "bottom",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                color: "#000000",
                font: {
                  size: 12,
                },
              },
            },
          },
        },
      })

      chartInstances.push(bookingsChart, hoursChart, pieChart)
    }

    if (reportType === "maintenance") {
      // Ensure data is properly formatted
      const processedData = (reportData?.data || []).map((row: any) => ({
        priority: row.priority ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1) : "Unknown",
        totalReports: row.count ?? 0,
        resolved: row.resolved ?? 0,
        avgResolutionTime:
          row.avg_resolution_time !== "N/A" && !isNaN(Number.parseFloat(row.avg_resolution_time))
            ? Number.parseFloat(row.avg_resolution_time)
            : 0,
      }))

      // Set canvas dimensions and styles
      const fixedWidth = 500
      const fixedHeight = 300

      ctx1.width = fixedWidth
      ctx1.height = fixedHeight
      ctx1.style.pageBreakBefore = "always"
      ctx1.style.breakBefore = "page"
      ctx1.style.marginTop = "20px"

      ctx2.width = fixedWidth
      ctx2.height = fixedHeight
      ctx2.style.pageBreakBefore = "always"
      ctx2.style.breakBefore = "page"
      ctx2.style.marginTop = "20px"

      ctx3.width = fixedWidth
      ctx3.height = fixedHeight
      ctx3.style.pageBreakBefore = "always"
      ctx3.style.breakBefore = "page"
      ctx3.style.marginTop = "20px"

      const barChart = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: processedData.map((d: any) => d.priority),
          datasets: [
            {
              label: "Total Reports",
              data: processedData.map((d: any) => d.totalReports),
              backgroundColor: processedData.map(
                (_d: any, index: number) => ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5],
              ),
            },
            {
              label: "Resolved",
              data: processedData.map((d: any) => d.resolved),
              backgroundColor: processedData.map(
                (_d: any, index: number) => ["#A4DE6C", "#D0ED57", "#8884D8", "#FF8042", "#0088FE"][index % 5],
              ),
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            onComplete: onChartRendered,
          },
          plugins: {
            title: {
              display: true,
              text: "Maintenance Reports by Priority",
              font: { size: 16, weight: "bold" as const },
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: "#000000",
                font: {
                  size: 12,
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Priority",
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Report Count",
              },
            },
          },
        },
      })

      // Filter out items with N/A resolution time for the line chart
      const filteredData = processedData.
      //@ts-ignore
      filter((item) => item.avgResolutionTime > 0)

      const lineChart = new Chart(ctx2, {
        type: "line",
        data: {
          labels: filteredData.map((d: any) => d.priority),
          datasets: [
            {
              label: "Avg. Resolution Time (hrs)",
              data: filteredData.map((d: any) => d.avgResolutionTime),
              borderColor: "#2196f3",
              backgroundColor: "rgba(33, 150, 243, 0.2)",
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 6,
              pointBackgroundColor: "#2196f3",
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            onComplete: onChartRendered,
          },
          plugins: {
            title: {
              display: true,
              text: "Average Resolution Time by Priority",
              font: { size: 16, weight: "bold" as const },
            },
            legend: {
              position: "bottom",
              labels: {
                color: "#000000",
                font: {
                  size: 12,
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Hours",
              },
            },
          },
        },
      })

      const pieChart = new Chart(ctx3, {
        type: "pie",
        data: {
          labels: processedData.map((d: any) => d.priority),
          datasets: [
            {
              label: "Total Reports",
              data: processedData.map((d: any) => d.totalReports),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
                "#FFB6C1",
                "#00E676",
                "#673AB7",
                "#FF5722",
              ],
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            onComplete: onChartRendered,
          },
          plugins: {
            title: {
              display: true,
              text: "Distribution of Maintenance Issues by Priority",
              font: { size: 16, weight: "bold" as const },
            },
            legend: {
              position: "bottom",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                color: "#000000",
                font: {
                  size: 12,
                },
              },
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => {
                  let label = tooltipItem.label || ""
                  if (label) label += ": "
                  const total = processedData.reduce((sum: number, item: any) => sum + item.totalReports, 0)
                  label += `${tooltipItem.raw} reports (${(((tooltipItem.raw as number) / total) * 100).toFixed(1)}%)`
                  return label
                },
              },
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

    try {
      // Create a new PDF document
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Capture the report header
      const headerElement = document.getElementById("report-header")
      if (headerElement) {
        const headerCanvas = await html2canvas(headerElement, {
          scale: 2,
          backgroundColor: "#ffffff",
        })
        const headerImgData = headerCanvas.toDataURL("image/png")
        const headerImgHeight = (headerCanvas.height * pdfWidth) / headerCanvas.width

        // Add header to first page
        pdf.addImage(headerImgData, "PNG", 0, 0, pdfWidth, headerImgHeight)

        // Move position down for table
        let yPosition = headerImgHeight + 10

        // Capture the table
        const tableElement = document.getElementById("report-table")
        if (tableElement) {
          const tableCanvas = await html2canvas(tableElement, {
            scale: 2,
            backgroundColor: "#ffffff",
          })
          const tableImgData = tableCanvas.toDataURL("image/png")
          const tableImgHeight = (tableCanvas.height * pdfWidth) / tableCanvas.width

          // Check if table fits on first page
          if (yPosition + tableImgHeight > pdfHeight) {
            pdf.addPage()
            yPosition = 10
          }

          // Add table to PDF
          pdf.addImage(tableImgData, "PNG", 0, yPosition, pdfWidth, tableImgHeight)
          yPosition += tableImgHeight + 10
        }

        // Add each chart on a new page
        for (let i = 1; i <= 3; i++) {
          const chartElement = document.getElementById(`chart${i}`)
          if (chartElement) {
            // Always start a new page for each chart
            pdf.addPage()

            const chartCanvas = await html2canvas(chartElement, {
              scale: 2,
              backgroundColor: "#ffffff",
            })
            const chartImgData = chartCanvas.toDataURL("image/png")
            const chartImgWidth = pdfWidth - 20 // Add some margin
            const chartImgHeight = (chartCanvas.height * chartImgWidth) / chartCanvas.width

            // Center the chart on the page
            const xPosition = (pdfWidth - chartImgWidth) / 2
            const yPosition = (pdfHeight - chartImgHeight) / 2

            pdf.addImage(chartImgData, "PNG", xPosition, yPosition, chartImgWidth, chartImgHeight)
          }
        }

        // Save the PDF
        pdf.save(`${reportData?.title || "iReserve_Report"}.pdf`)

        // If autoDownload is true, navigate back after a short delay
        if (autoDownload) {
          setTimeout(() => {
            navigate(-1)
          }, 1000)
        }
      }
    } catch (err) {
      console.error("PDF generation failed:", err)
      setError("Failed to generate PDF. Please try again.")
    } finally {
      setGeneratingPdf(false)
    }
  }

  const renderTable = () => {
    if (!reportData?.data) return null

    if (reportType === "facility-usage") {
      return (
        <TableContainer
          component={Paper}
          sx={{
            width: "100%",
            overflowX: "auto",
            pageBreakInside: "avoid",
            breakInside: "avoid",
            marginBottom: "20px",
            color:"blue",
          }}
        >
          <Table size="small" sx={{ tableLayout: "fixed"}}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "blue" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Facility</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold"}}>
                  Bookings
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Events
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Total Hours
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold"}}>
                  Utilization (%)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((row: any, index: number) => {
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

                return (
                  <TableRow
                    key={row.facility_id || index}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "blue" : "blue",
                      "&:hover": { backgroundColor: "blue" },
                    }}
                  >
                    <TableCell>{row.facility_name ?? "Unknown"}</TableCell>
                    <TableCell align="right">{row.number_of_bookings}</TableCell>
                    <TableCell align="right">{row.number_of_events}</TableCell>
                    <TableCell align="right">{row.total_event_hours}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: "blue",
                        fontWeight: "bold",
                        borderRadius: "4px",
                      }}
                    >
                      {`${calculatedUtilization}%`}
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
            marginBottom: "20px",
            color: "blue",
          }}
        >
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "blue" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Priority</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Total Reports
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Resolved
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Avg. Resolution Time (hrs)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Resolution Rate (%)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.data.map((row: any, idx: number) => {
                const resolutionRate = row.count > 0 ? ((row.resolved / row.count) * 100).toFixed(1) : "0.0"

                const bgColor =
                  Number.parseFloat(resolutionRate) > 80
                    ? "blue" // light green
                    : Number.parseFloat(resolutionRate) > 50
                      ? "blue" // light amber
                      : "blue" // light red

                return (
                  <TableRow
                    key={idx}
                    sx={{
                      backgroundColor: idx % 2 === 0 ? "blue" : "blue",
                      "&:hover": { backgroundColor: "#f1f1f1" },
                    }}
                  >
                    <TableCell>
                      {row.priority ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1) : "Unknown"}
                    </TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">{row.resolved}</TableCell>
                    <TableCell align="right">
                      {row.avg_resolution_time === "N/A"
                        ? "0"
                        : Number.parseFloat(row.avg_resolution_time).toFixed(1)}
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: bgColor }}>
                      {resolutionRate}%
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    return null
  }

  const renderReportHeader = () => {
    if (!reportData) return null

    return (
      <Box
        id="report-header"
        sx={{
          padding: "20px",
          marginBottom: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          textAlign: "center",
          color: "green",
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          {reportData.title}
        </Typography>
        <Typography variant="subtitle1">Generated on: {new Date().toLocaleDateString()}</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        maxWidth: "100%",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <Typography variant="h4" component="h1">
          Report
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PdfIcon />}
            onClick={handleDownloadPdf}
            disabled={generatingPdf || !chartsReady}
          >
            {generatingPdf ? (
              <>
                Generating PDF...
                <CircularProgress size={20} sx={{ ml: 1, color: "white" }} />
              </>
            ) : (
              "Download PDF"
            )}
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate(-1)} sx={{ ml: 2 }}>
            Back
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <section ref={reportRef}>
        {renderReportHeader()}
        <section id="report-table">{renderTable()}</section>
        <figure>
          <canvas id="chart1"></canvas>
        </figure>
        <figure>
          <canvas id="chart2"></canvas>
        </figure>
        <figure>
          <canvas id="chart3"></canvas>
        </figure>
      </section>

    </Box>
  )
}
export default ExportPdfPage
