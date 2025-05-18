"use client"

// imports remain the same
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
} from "@mui/material"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Chart from "chart.js/auto"
import PdfIcon from "@mui/icons-material/PictureAsPdf"
import { useLocation, useNavigate } from "react-router-dom"
import type { FC } from "react"
import { green } from "@mui/material/colors"

let chartInstances: Chart[] = []

const ExportPdfPage: FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
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
      handleDownloadPdf().then(() => {
        // Return to previous page after download completes
        setTimeout(() => {
          if (location.state?.returnTo) {
            navigate(location.state.returnTo)
          } else {
            navigate(-1) // Go back to previous page
          }
        }, 500)
      })
    }
  }, [autoDownload, chartsReady, generatingPdf, hasDownloaded, navigate, location])

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
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          onComplete: onChartRendered,
        },
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              padding: 20,
              font: {
                size: 12,
              },
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
          plugins: {
            title: {
              display: true,
              text: "Facility Booking and Event Comparison",
              font: { size: 16, weight: "bold" },
            },
            tooltip: {
              enabled: true,
            },
            legend: {
              position: "top",
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
          plugins: {
            title: {
              display: true,
              text: "Facility Usage Trends",
              font: { size: 16, weight: "bold" },
            },
            tooltip: {
              enabled: true,
            },
            legend: {
              position: "top",
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
          layout: {
            padding: 20,
          },
          plugins: {
            title: {
              display: true,
              font: { size: 16, weight: "bold" },
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
              position: "right" as const,
              align: "start" as const,
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 15,
                boxWidth: 10,
                font: {
                  size: 11,
                },
              },
            },
          },
        },
      })

      chartInstances.push(bookingsChart, hoursChart, pieChart)
    }

    if (reportType === "maintenance") {
      // Similar updates for maintenance charts...
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
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
            },
            {
              label: "Resolved",
              data: processedData.map((d: any) => d.resolved),
              backgroundColor: ["#A4DE6C", "#D0ED57", "#8884D8", "#FF8042", "#0088FE"],
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
              text: "Maintenance Report by Priority",
              font: { size: 16, weight: "bold" },
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
            legend: {
              display: true,
              position: "top",
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

      const lineChart = new Chart(ctx2, {
        type: "line",
        data: {
          labels: reportData.data.map((d: any) => d.priority),
          datasets: [
            {
              label: "Avg. Resolution Time (hrs)",
              data: reportData.data.map((d: any) => d.avg_resolution_time),
              borderColor: "#2196f3",
              fill: false,
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
              text: "Resolution Time Analysis",
              font: { size: 16, weight: "bold" },
            },
          },
        },
      })

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
              backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Maintenance Tasks by Priority",
              font: { size: 16, weight: "bold" },
            },
            legend: {
              position: "right",
              align: "start" as const,
              labels: {
                padding: 15,
                font: {
                  size: 12,
                },
              },
            },
            tooltip: {
              enabled: true,
            },
          },
          layout: {
            padding: 20,
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
      // Create PDF document with proper formatting
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Get the report element sections
      const reportElement = reportRef.current

      // First capture the header and table section
      //@ts-ignore
      const headerSection = reportElement.querySelector(".header-section")
      //@ts-ignore
      const tableSection = reportElement.querySelector(".table-section")

      if (headerSection) {
        const headerCanvas = await html2canvas(headerSection, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })

        const headerImgData = headerCanvas.toDataURL("image/png")
        const headerImgWidth = pdfWidth - 20 // Add some margin
        const headerImgHeight = (headerCanvas.height * headerImgWidth) / headerCanvas.width

        // Add header to first page
        pdf.addImage(headerImgData, "PNG", 10, 10, headerImgWidth, headerImgHeight)

        // Add table below header
        if (tableSection) {
          const tableCanvas = await html2canvas(tableSection, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
          })

          const tableImgData = tableCanvas.toDataURL("image/png")
          const tableImgWidth = pdfWidth - 20
          const tableImgHeight = (tableCanvas.height * tableImgWidth) / tableCanvas.width

          // Check if table fits on first page
          if (headerImgHeight + tableImgHeight + 20 > pdfHeight) {
            pdf.addPage()
            pdf.addImage(tableImgData, "PNG", 10, 10, tableImgWidth, tableImgHeight)
          } else {
            pdf.addImage(tableImgData, "PNG", 10, headerImgHeight + 20, tableImgWidth, tableImgHeight)
          }
        }
      }

      // Add a new page for charts and analysis
      pdf.addPage()

      // Add analysis text
      //@ts-ignore
      const analysisSection = reportElement.querySelector(".analysis-section")
      if (analysisSection) {
        const analysisCanvas = await html2canvas(analysisSection, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })

        const analysisImgData = analysisCanvas.toDataURL("image/png")
        const analysisImgWidth = pdfWidth - 20
        const analysisImgHeight = (analysisCanvas.height * analysisImgWidth) / analysisCanvas.width

        pdf.addImage(analysisImgData, "PNG", 10, 10, analysisImgWidth, analysisImgHeight)
      }

      // Capture each chart individually and add to PDF
      //@ts-ignore
      const chartElements = reportElement.querySelectorAll(".chart-container")
      let yPosition = analysisSection ? 70 : 10 // Start position after analysis or at top

      for (let i = 0; i < chartElements.length; i++) {
        const chartCanvas = await html2canvas(chartElements[i], {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })

        const chartImgData = chartCanvas.toDataURL("image/png")
        const chartImgWidth = pdfWidth - 20
        const chartImgHeight = (chartCanvas.height * chartImgWidth) / chartCanvas.width

        // Check if chart will fit on current page
        if (yPosition + chartImgHeight > pdfHeight - 10) {
          pdf.addPage()
          yPosition = 10
        }

        // Add chart to PDF
        pdf.addImage(chartImgData, "PNG", 10, yPosition, chartImgWidth, chartImgHeight)
        yPosition += chartImgHeight + 10 // Add spacing between charts
      }

      // Add conclusion section if it exists
      //@ts-ignore
      const conclusionSection = reportElement.querySelector(".conclusion-section")
      if (conclusionSection) {
        // Check if conclusion will fit on current page
        if (yPosition > pdfHeight - 60) {
          pdf.addPage()
          yPosition = 10
        }

        const conclusionCanvas = await html2canvas(conclusionSection, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })

        const conclusionImgData = conclusionCanvas.toDataURL("image/png")
        const conclusionImgWidth = pdfWidth - 20
        const conclusionImgHeight = (conclusionCanvas.height * conclusionImgWidth) / conclusionCanvas.width

        pdf.addImage(conclusionImgData, "PNG", 10, yPosition, conclusionImgWidth, conclusionImgHeight)
      }

      pdf.save(`${reportData?.title || "iReserve_Report"}.pdf`)

      // Important: If not auto-downloading, don't navigate away
      if (!autoDownload) {
        setGeneratingPdf(false)
        return true // Return true to indicate success
      }

      return true // Return true to indicate success
    } catch (err) {
      console.error("PDF generation failed:", err)
      setGeneratingPdf(false)
      return false
    }
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
            mb: 3,
          }}
        >
          <Table
            size="small"
            sx={{
              tableLayout: "fixed",
              width: "100%",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "30%" }}>Facility</TableCell>
                <TableCell align="right">Bookings</TableCell>
                <TableCell align="right">Events</TableCell>
                <TableCell align="right">Total Hours</TableCell>
                <TableCell align="right">Utilization (%)</TableCell>
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
                  <TableRow key={row.facility_id} sx={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        maxWidth: "200px",
                      }}
                    >
                      {row.facility_name ?? "Unknown"}
                    </TableCell>
                    <TableCell align="right">{row.number_of_bookings}</TableCell>
                    <TableCell align="right">{row.number_of_events}</TableCell>
                    <TableCell align="right">{Math.round(row.total_event_hours)}</TableCell>
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
            mb: 3,
          }}
        >
          <Table size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: "0.75rem", width: "25%" }}>Priority</TableCell>
                <TableCell align="right" sx={{ fontSize: "0.75rem", width: "25%" }}>
                  Total Reports
                </TableCell>
                <TableCell align="right" sx={{ fontSize: "0.75rem", width: "25%" }}>
                  Resolved
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "normal", fontSize: "0.75rem", width: "25%" }}>
                  Avg. Resolution
                  <br />
                  Time (hrs)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData?.data?.map((row: any, idx: number) => (
                <TableRow key={idx} sx={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <TableCell sx={{ fontSize: "0.75rem" }}>{row.priority}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.75rem" }}>
                    {row.count}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.75rem" }}>
                    {row.resolved}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.75rem" }}>
                    {row.avg_resolution_time === "N/A" || row.avg_resolution_time == null
                      ? 0
                      : Math.round(row.avg_resolution_time / 36)}
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

  const renderReportContent = () => (
    <Box p={3}>
      {!autoDownload && (
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={handleDownloadPdf}
          disabled={generatingPdf}
          sx={{ mb: 2 }}
        >
          {generatingPdf ? <CircularProgress size={24} color="inherit" /> : "Download PDF"}
        </Button>
      )}

      <Box
        ref={reportRef}
        sx={{
          position: "absolute",
          left: "-9999px",
          width: "800px",
          bgcolor: "white",
          p: 2,
          "& .MuiTypography-root": {
            pageBreakInside: "avoid",
            breakInside: "avoid",
          },
        }}
      >
        {/* Header Section */}
        <Box className="header-section" sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "green" }} gutterBottom>
            📊 iReserve System Report Overview
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "green" }} gutterBottom>
            {reportData?.title || "Facility Usage Report"}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "green" }} gutterBottom>
            {reportData?.period || ""}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: "green", mb: 3 }}>
            This report provides a comprehensive analysis of{" "}
            {reportType === "facility-usage"
              ? "facility usage patterns, booking trends, and utilization metrics"
              : "maintenance tasks, resolution times, and priority distribution"}
            for the specified period. The data presented here can be used to make informed decisions about resource
            allocation, maintenance scheduling, and facility management.
          </Typography>
        </Box>

        {/* Table Section */}
        <Box className="table-section" sx={{ mb: 4, color: "green" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {reportType === "facility-usage" ? "Facility Usage Summary" : "Maintenance Tasks Summary"}
          </Typography>
          {renderTable()}
        </Box>

        {/* Analysis Section */}
        <Box className="analysis-section" sx={{ mb: 4, pageBreakBefore: "always", breakBefore: "page" }}>
          <Typography variant="h6" sx={{ mb: 2, color: "greeny" }}>
            Key Insights and Analysis
          </Typography>
          <Typography variant="body1"  sx={{ mt: 2, color: "green", mb: 3 }} paragraph>
            {reportType === "facility-usage"
              ? "The data indicates varying levels of facility utilization across different spaces. " +
                "High-utilization facilities may require additional resources or expanded capacity, " +
                "while low-utilization spaces might benefit from promotional activities or repurposing."
              : "Maintenance tasks are distributed across different priority levels, with resolution times " +
                "varying accordingly. High-priority issues are generally resolved more quickly, though " +
                "the volume of such tasks impacts overall resource allocation."}
          </Typography>
          <Typography variant="body1"  sx={{ mt: 2, color: "green", mb: 3 }} paragraph>
            {reportType === "facility-usage"
              ? "Booking patterns show peak usage during certain periods, suggesting opportunities " +
                "for optimized scheduling and potential for increased revenue through strategic pricing models."
              : "The resolution rate indicates the efficiency of the maintenance team in addressing reported issues. " +
                "Areas with lower resolution rates may require additional staffing or process improvements."}
          </Typography>
        </Box>

        {/* Charts Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, textAlign: "center" }}>
            Visual Data Analysis
          </Typography>

          <Box className="chart-container" sx={{ mb: 5, pageBreakInside: "avoid", breakInside: "avoid" }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}>
              {reportType === "facility-usage" ? "Booking and Event Distribution" : "Maintenance Tasks by Priority"}
            </Typography>
            <canvas id="chart1" width="500" height="300" />
            <Typography variant="body2" color={green} sx={{ mt: 2, fontStyle: "italic", color: "green", textAlign: "center" }}>
              {reportType === "facility-usage"
                ? "Chart shows the distribution of bookings and events across different facilities."
                : "Chart shows the distribution of maintenance tasks by priority level and resolution status."}
            </Typography>
          </Box>

          <Box className="chart-container" sx={{ mb: 5, pageBreakInside: "avoid", breakInside: "avoid" }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold", color: "green", textAlign: "center" }}>
              {reportType === "facility-usage" ? "Usage Trends Analysis" : "Resolution Time Analysis"}
            </Typography>
            <canvas id="chart2" width="500" height="300" />
            <Typography variant="body2" sx={{ mt: 2, fontStyle: "italic", color: "green", textAlign: "center" }}>
              {reportType === "facility-usage"
                ? "Line chart illustrates the relationship between bookings and events for each facility."
                : "Line chart shows average resolution time (in hours) for each priority level."}
            </Typography>
          </Box>

          <Box className="chart-container" sx={{ mb: 3, pageBreakInside: "avoid", breakInside: "avoid" }}>
            <Typography variant="subtitle1" color={green} sx={{ mb: 1, fontWeight: "bold", color:"green", textAlign: "center" }}>
              {reportType === "facility-usage" ? "Proportional Distribution" : "Priority Distribution"}
            </Typography>
            <Box sx={{ width: "500px", height: "400px" }}>
              <canvas id="chart3" width="500" height="400" />
            </Box>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: "italic", color: "green", textAlign: "center" }}>
              {reportType === "facility-usage"
                ? "Pie chart shows the proportional distribution of events across facilities."
                : "Pie chart illustrates the distribution of maintenance tasks by priority level."}
            </Typography>
          </Box>
        </Box>

        {/* Conclusion Section */}
        <Box className="conclusion-section" sx={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Conclusions and Recommendations
          </Typography>
          <Typography variant="body1"  sx={{ mt: 2, color: "green", mb: 3 }} paragraph>
            {reportType === "facility-usage"
              ? "Based on the analysis, we recommend focusing on optimizing the usage of facilities with " +
                "lower utilization rates. Consider implementing promotional strategies or adjusting pricing " +
                "models to encourage increased bookings during off-peak times."
              : "The maintenance data suggests that process improvements could be made to reduce resolution " +
                "times for medium and low priority tasks without impacting high-priority issue resolution. " +
                "Consider reviewing staffing allocations and maintenance workflows."}
          </Typography>
          <Typography variant="body1"  sx={{ mt: 2, color: "green", mb: 3 }} paragraph>
            {reportType === "facility-usage"
              ? "For high-utilization facilities, consider expanding capacity or adding similar facilities " +
                "to meet demand. Regular monitoring of booking patterns will help identify emerging trends " +
                "and opportunities for revenue optimization."
              : "Regular preventive maintenance could reduce the number of high-priority issues, leading to " +
                "more efficient resource allocation and improved facility conditions overall."}
          </Typography>
          <Typography variant="body2" color={green} sx={{ mt: 4, fontStyle: "italic", color: "text.secondary", textAlign: "center" }}>
            Report generated by iReserve System on {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return renderReportContent()
}

export default ExportPdfPage
