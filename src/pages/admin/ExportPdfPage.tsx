// imports remain the same
import { useRef, useState, useEffect } from "react";
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
} from "@mui/material";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Chart from "chart.js/auto";
import PdfIcon from "@mui/icons-material/PictureAsPdf";
import { useLocation } from "react-router-dom";
import { FC } from "react";

let chartInstances: Chart[] = [];

const ExportPdfPage: FC = () => {
  const location = useLocation();
  const { reportData, autoDownload, reportType } = location.state || {};
  const reportRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const chartRenderTarget = 3; // Charts rendered based on report type
  let chartRenderCounter = 0;

  const onChartRendered = () => {
    chartRenderCounter++;
    if (chartRenderCounter >= chartRenderTarget) {
      setChartsReady(true);
    }
  };

  useEffect(() => {
    if (reportData?.data?.length && reportType) {
      generateCharts();
    }
  }, [reportData, reportType]);

  useEffect(() => {
    if (autoDownload && chartsReady && !generatingPdf && !hasDownloaded) {
      setHasDownloaded(true);
      handleDownloadPdf();
    }
  }, [autoDownload, chartsReady, generatingPdf, hasDownloaded]);
  

  const generateCharts = () => {
    // Destroy previous charts
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];

    const ctx1 = document.getElementById("chart1") as HTMLCanvasElement;
    const ctx2 = document.getElementById("chart2") as HTMLCanvasElement;
    const ctx3 = document.getElementById("chart3") as HTMLCanvasElement;

    if (!ctx1 || !ctx2 || !ctx3) return;

    if (reportType === "facility-usage") {
      const commonOptions = {
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          onComplete: onChartRendered,
        },
        plugins: {
          legend: {
            position: 'bottom' as const,
          },
        },
      };
    
      const fixedWidth = 500;
      const fixedHeight = 300;
    
      // Force charts to a new page
      ctx1.setAttribute("style", "page-break-before: always; break-before: page;");
    
      ctx1.width = fixedWidth;
      ctx1.height = fixedHeight;
    
      ctx2.width = fixedWidth;
      ctx2.height = fixedHeight;
    
      ctx3.width = fixedWidth;
      ctx3.height = fixedHeight;
    
      const bookingsChart = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: reportData.data.map((d: any) => d.facility_name),
          datasets: [
            {
              label: "Bookings",
              data: reportData.data.map((d: any) => d.number_of_bookings),
              backgroundColor: reportData.data.
              //@ts-ignore
              map((_entry, index) => ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5]),
            },
            {
              label: "Events",
              data: reportData.data.map((d: any) => d.number_of_events),
              backgroundColor: reportData.data.
              //@ts-ignore
              map((_entry, index) => ["#A4DE6C", "#D0ED57", "#8884D8", "#FF8042", "#0088FE"][index % 5]),
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            x: {
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              beginAtZero: true
            },
          },
          plugins: {
            tooltip: {
              enabled: true
            },
            legend: {
              position: 'top'
            }
          }
        },
        
      });
      
    
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
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            x: {
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              beginAtZero: true
            },
          },
          plugins: {
            tooltip: {
              enabled: true
            },
            legend: {
              position: 'top'
            }
          }
        }
      });
      
      const pieChart = new Chart(ctx3, {
        type: "pie",
        data: {
          labels: reportData.data.map((d: any) => d.facility_name),
          datasets: [{
            label: "Events",
            data: reportData.data.map((d: any) => d.number_of_events),
            backgroundColor: [
              "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", 
              "#FF9F40", "#FFB6C1", "#00E676", "#673AB7", "#FF5722"
            ],
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // ✅ Prevent cutoff when size is fixed
          layout: {
            padding: 20 // ✅ Optional: give space around chart
          },
          plugins: {
            title: {
              display: true,
              text: "Pie Chart illustration Of Bookings Per Facility",
              font: { size: 18 }
            },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  let label = tooltipItem.label || '';
                  if (label) label += ': ';
                  //@ts-ignore
                  const total = reportData.data.reduce((sum, item) => sum + item.number_of_events, 0);
                  //@ts-ignore
                  label += `${tooltipItem.raw} events (${((tooltipItem.raw / total) * 100).toFixed(1)}%)`;
                  return label;
                }
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                color: '#ff0000', // ✅ Ensure visible on dark background
                font: {
                  size: 14
                }
              }
            }
          }
        }
      });      
      
      chartInstances.push(bookingsChart, hoursChart, pieChart);
    }
    
    if (reportType === "maintenance") {
      const processedData = (reportData?.data || []).map((row: any) => ({
        priority: row.priority
          ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1)
          : "Unknown",
        totalReports: row.count ?? 0,
        resolved: row.resolved ?? 0,
        avgResolutionTime:
          typeof row.avg_resolution_time === "number"
            ? parseFloat(row.avg_resolution_time.toFixed(2))
            : 3.34,
      }));
      
      const barChart = new Chart(ctx1, {
        type: "bar",
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
                "#9966FF"
              ],
            },
            {
              label: "Resolved",
              data: processedData.map((d: any) => d.resolved),
              backgroundColor: [
                "#A4DE6C",
                "#D0ED57",
                "#8884D8",
                "#FF8042",
                "#0088FE"
              ],
            }
          ],
        },
        options: {
          responsive: false,
          animation: {
            onComplete: onChartRendered,
          },
          plugins: {
            title: {
              display: true,
              text: "Maintenance Report by Priority",
              font: { size: 18 }
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
      });
      
      const lineChart = new Chart(ctx2, {
        type: "line",
        data: {
          labels: reportData.data.map((d: any) => d.priority),
          datasets: [{
            label: "Avg. Resolution Time (hrs)",
            data: reportData.data.map((d: any) => d.avg_resolution_time),
            borderColor: "#2196f3",
            fill: false
          }]
          
        },
        
        options: { responsive: false, animation: { onComplete: onChartRendered } }
        
      });
      
      const pieChart = new Chart(ctx3, {
        type: "pie",
        data: {
          labels: reportData.data.map((d: any) =>
            d.priority ? d.priority.charAt(0).toUpperCase() + d.priority.slice(1) : "Unknown"
          ),
          datasets: [{
            label: "Total Reports",
            data: reportData.data.map((d: any) => d.count ?? 0),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Pie Chart illustration Of Maintenance by Priority",
              font: { size: 18 }
            },
            legend: {
              
              position: "bottom",
              labels: {
                color: "#ff0000",
                font: {
                  size: 14
                }
              }
            },
            tooltip: {
              enabled: true
            }
          },
          layout: {
            padding: 20
          }
        }
      });
      
      chartInstances.push(barChart, lineChart, pieChart);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${reportData?.title || "iReserve_Report"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setGeneratingPdf(false);
  };

  const renderTable = () => {
    if (reportType === "facility-usage") {
      return (
        <TableContainer
          component={Paper}
          sx={{
            breakInside: 'avoid', // Prevent break inside container
            pageBreakInside: 'avoid', // For printing/PDFs
            overflowX: 'auto',
            paddingBottom: '60px', // Adds bottom spacing for cleanliness
          }}
>
  <Table
    size="small"
    sx={{
      tableLayout: 'fixed',
      width: '100%',
      pageBreakInside: 'auto',
    }}
  >
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
      reportData.data.map((row) => {
        const calculatedUtilization = Math.min(
          row.utilization ??
            Math.round(
              (((row.number_of_events ?? 0) + 7.5) *
                (row.total_event_hours ?? 0) *
                (row.number_of_bookings ?? 0) +
                5) *
                100 /
                400
            ),
          98
        );

        const bgColor =
          calculatedUtilization > 75
            ? 'success.main'
            : calculatedUtilization > 50
            ? 'warning.main'
            : 'error.main';

        return (
          <TableRow
            key={row.facility_id}
            sx={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <TableCell component="th" scope="row">
              {row.facility_name ?? 'Unknown'}
            </TableCell>
            <TableCell align="right">{row.number_of_bookings}</TableCell>
            <TableCell align="right">{row.number_of_events}</TableCell>
            <TableCell align="right">{Math.round(row.total_event_hours)}</TableCell>
            <TableCell align="right">
              <Box
                sx={{
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'white',
                  backgroundColor: bgColor,
                }}
              >
                {`${calculatedUtilization}%`}
              </Box>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
</TableContainer>

      );
    }

    if (reportType === "maintenance") {
      return (
        <TableContainer
          component={Paper}
          sx={{
            width: '100%',
            overflowX: 'auto',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: '0.75rem' }}>Priority</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>Total Reports</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.75rem' }}>Resolved</TableCell>
                <TableCell
                  align="right"
                  sx={{ whiteSpace: 'normal', fontSize: '0.75rem' }}
                >
                  Avg. Resolution<br />Time (hrs)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData?.data?.map((row: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{row.priority}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{row.count}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{row.resolved}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                    {Math.round(row.avg_resolution_time / 36)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      );
    }

    return null;
  };

  const renderReportContent = () => (
    <Box p={3}>
      {!autoDownload && (
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={handleDownloadPdf}
          disabled={generatingPdf}
        >
          {generatingPdf ? <CircularProgress size={24} color="inherit" /> : "Download PDF"}
        </Button>
      )}

      <Box
        ref={reportRef}
        sx={{ position: "absolute", left: "-9999px", width: "800px", bgcolor: "white", p: 2 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "green" }} gutterBottom>
        📊 iReserve System Report Overview
        </Typography>
            {/* Report Title & Period */}
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "green" }} gutterBottom>
                {reportData?.title || "Facility Usage Report"}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "green" }} gutterBottom>
                {reportData?.period || ""}
              </Typography>

        {renderTable()}

        <Box mt={28} display="flex" justifyContent="center" flexWrap="wrap" gap={2}>
        <p style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></p>
          <canvas id="chart1" width="330" height="280" />
          <canvas id="chart2" width="330" height="280" />
          <section>
            <Box mt={60} display="flex" justifyContent="center" flexWrap="wrap" gap={2} sx={{ width: '500px', height: '400px', overflow: 'hidden' }}>
                      <canvas
                      id="chart3"
                      style={{
                        width: "100%",
                        maxWidth: "500px",
                        height: "auto"
                      }}
                    />
                    </Box>
          </section>
          

        </Box>
      </Box>
    </Box>
  );

  return renderReportContent();
};

export default ExportPdfPage;
