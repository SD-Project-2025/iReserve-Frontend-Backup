"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Typography, Grid, Button, Box, Card, CardContent, Alert, 
  ButtonGroup, Chip 
} from "@mui/material"
import {
  CalendarMonth as CalendarIcon,
  SportsTennis as SportsIcon,
  Event as EventIcon,
  Build as MaintenanceIcon,
  Notifications as NotificationIcon,
  WbSunny as SunIcon,
  Cloud as CloudIcon,
  Umbrella as UmbrellaIcon,
  AcUnit as SnowIcon,
  FlashOn as StormIcon,
  Home as HomeIcon
} from "@mui/icons-material"
import { useAuth } from "../../contexts/AuthContext"
import { api } from "../../services/api"
import DashboardCard from "../../components/dashboard/DashboardCard"
import RecentActivityList from "../../components/dashboard/RecentActivityList"
import { DateCalendar, PickersDay } from "@mui/x-date-pickers"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { isSameDay } from "date-fns"

const OPENWEATHER_API_KEY = "503990715e3d001d29e30e6113559cee";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Helper: join bookings with facilities (for active and future bookings)
const getActiveBookingsWithFacilities = (bookings: Booking[], facilities: Facility[]) => {
  const today = new Date().toISOString().split('T')[0];
  return bookings
    .filter(booking => 
      // only approved or pending AND future bookings
      (booking.status === "approved" || booking.status === "pending") &&
      booking.date >= today
    )
    .map(booking => ({
      ...booking,
      facility: facilities.find(f => f.facility_id === booking.facility_id)
    }))
    .filter(booking => 
      // only include bookings that have a facility and the facility is open
      booking.facility && booking.facility.status === "open"
    );
};

// Updated location mapping function with logging and detailed mappings
const mapCustomLocationToStandard = (customLocation: string): string => {
  console.log("Mapping location:", customLocation);
  const lower = customLocation.toLowerCase();
  //@ts-ignore
  // Extract the main portion before the comma if present
  const mainLocation = lower.split(',')[0].trim();

  const locationMappings: { [key: string]: string } = {
    'nexus hub': 'Randburg, South Africa',
    'wits university sports complex': 'Braamfontein, South Africa',
    'randburg martial arts academy': 'Randburg, South Africa',
    'dance cafe': 'Johannesburg, South Africa',
    'sandton sports club': 'Sandton, South Africa',
    'westdene sports grounds': 'Johannesburg, South Africa',
    'houghton squash club': 'Johannesburg, South Africa',
    'university of johannesburg': 'Johannesburg, South Africa',
    'emmarentia dam park': 'Emmarentia, South Africa',
    'virgin active': 'Rosebank, Johannesburg, South Africa',
    'ellis park arena': 'Johannesburg, South Africa',
    'ellis park swimming pool': 'Johannesburg, South Africa',
    'yoga works': 'Johannesburg, South Africa',
    'cityrock johannesburg': 'Randburg, South Africa',
    'hillbrow boxing club': 'Hillbrow, South Africa'
  };

  for (const [key, value] of Object.entries(locationMappings)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  // Handle common districts
  if (lower.includes('randburg')) return 'Randburg, South Africa';
  if (lower.includes('sandton')) return 'Sandton, South Africa';
  if (lower.includes('rosebank')) return 'Rosebank, Johannesburg, South Africa';
  if (lower.includes('fourways')) return 'Fourways, Johannesburg, South Africa';
  
  // Default if no match
  return 'Johannesburg, South Africa';
};

interface WeatherData {
  facilityName: string
  location: string
  temperature: number
  weatherDescription: string
  weatherIcon: string
  hasAlert: boolean
}

interface Facility {
  facility_id: number
  name: string
  location: string
  status: string
  is_indoor?: boolean
}

interface Booking {
  booking_id: number
  facility_id: number
  facility?: Facility
  date: string
  start_time: string
  end_time: string
  status: string
  purpose: string
  attendees: number
}

interface ForecastData {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
  weather: [{
    id: number;
    main: string;
    description: string;
    icon: string;
  }];
  dt_txt: string;
}

interface Forecast {
  daily: {
    date: string;
    temp: number;
    description: string;
    icon: string;
    humidity?: number;
    windSpeed?: number;
  }[];
  alert?: string;
  temperatureRange?: {
    min: number;
    max: number;
  };
}

// Enhanced WeatherCard component with forecast support
const WeatherCard = ({ facility, weather, forecast }: { 
  facility: Facility; 
  weather: WeatherData;
  forecast?: Forecast;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showTab, setShowTab] = useState<'forecast' | 'details'>('forecast');
  
  const getWeatherIcon = (iconCode: string) => {
    switch (iconCode) {
      case '01d':
      case '01n':
        return <SunIcon sx={{ color: '#FFD700' }} />; // Clear sky
      case '02d':
      case '02n':
        return <CloudIcon sx={{ color: '#A9A9A9' }} />; // Few clouds
      case '03d':
      case '03n':
      case '04d':
      case '04n':
        return <CloudIcon sx={{ color: '#808080' }} />; // Scattered/broken clouds
      case '09d':
      case '09n':
        return <UmbrellaIcon sx={{ color: '#4682B4' }} />; // Shower rain
      case '10d':
      case '10n':
        return <UmbrellaIcon sx={{ color: '#4169E1' }} />; // Rain
      case '11d':
      case '11n':
        return <StormIcon sx={{ color: '#483D8B' }} />; // Thunderstorm
      case '13d':
      case '13n':
        return <SnowIcon sx={{ color: '#B0C4DE' }} />; // Snow
      default:
        return <CloudIcon sx={{ color: '#A9A9A9' }} />; // Default
    }
  };

  return (
    <Card 
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: expanded ? 'none' : 'translateY(-4px)',
        },
        bgcolor: facility.is_indoor ? 'background.default' : 'background.paper',
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: expanded ? 0 : undefined }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ 
            color: 'primary.main',
            fontWeight: 'bold' 
          }}>
            {facility.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {weather.location}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          mb: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'light' }}>
            {weather.temperature}°C
          </Typography>
          {getWeatherIcon(weather.weatherIcon)}
        </Box>

        {/* Status Chips */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flexWrap: 'wrap' 
        }}>
          <Chip
            icon={getWeatherIcon(weather.weatherIcon)}
            label={weather.weatherDescription}
            sx={{ 
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              textTransform: 'capitalize'
            }}
          />
          
          {facility.is_indoor && (
            <Chip
              icon={<HomeIcon />}
              label="Indoor Facility"
              sx={{ 
                bgcolor: 'success.light',
                color: 'success.contrastText'
              }}
            />
          )}

          {weather.hasAlert && (
            <Chip
              icon={<NotificationIcon />}
              label="Weather Alert"
              sx={{ 
                bgcolor: 'error.light',
                color: 'error.contrastText'
              }}
            />
          )}
          
          {forecast?.alert && (
            <Chip
              icon={<NotificationIcon />}
              label={forecast.alert}
              sx={{ 
                bgcolor: 'warning.light',
                color: 'warning.contrastText'
              }}
            />
          )}
        </Box>
        
        {/* Toggle button for expanded view */}
        <Button 
          fullWidth 
          sx={{ mt: 2 }} 
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show Less" : "Show More Details"}
        </Button>
        
        {/* Extended content */}
        {expanded && (
          <Box sx={{ mt: 2 }}>
            {/* Tab selection */}
            <Box sx={{ 
              display: 'flex', 
              borderBottom: 1, 
              borderColor: 'divider',
              mb: 2
            }}>
              <Button 
                variant={showTab === 'forecast' ? 'contained' : 'text'} 
                onClick={() => setShowTab('forecast')}
                size="small"
                sx={{ mr: 1 }}
              >
                5-Day Forecast
              </Button>
              <Button 
                variant={showTab === 'details' ? 'contained' : 'text'} 
                onClick={() => setShowTab('details')}
                size="small"
              >
                Weather Details
              </Button>
            </Box>
            
            {/* Forecast content */}
            {showTab === 'forecast' && forecast && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  overflowX: 'auto',
                  pb: 1
                }}>
                  {forecast.daily.map((day, index) => {
                    // Better date formatting
                    const date = new Date(day.date);
                    const dayName = index === 0 
                      ? 'Today' 
                      : index === 1 
                        ? 'Tomorrow' 
                        : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' });
                        
                    return (
                      <Box
                        key={day.date}
                        sx={{
                          minWidth: 80,
                          p: 1,
                          textAlign: 'center',
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Typography variant="caption" display="block">
                          {dayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {date.getDate()}/{date.getMonth() + 1}
                        </Typography>
                        {getWeatherIcon(day.icon)}
                        <Typography variant="body2" fontWeight="bold">
                          {day.temp}°C
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ textTransform: 'capitalize' }}>
                          {day.description}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
                
                {forecast.temperatureRange && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2">
                      Temperature range: {forecast.temperatureRange.min}°C - {forecast.temperatureRange.max}°C
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Weather details content */}
            {showTab === 'details' && forecast && forecast.daily.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Today's Weather Details:</Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Humidity</Typography>
                    <Typography variant="body2">{forecast.daily[0].humidity || 'N/A'}%</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Wind Speed</Typography>
                    <Typography variant="body2">{forecast.daily[0].windSpeed || 'N/A'} km/h</Typography>
                  </Box>
                </Box>
                
                {facility.is_indoor ? (
                  <Alert severity="success" sx={{ mt: 2, fontSize: '0.8rem' }}>
                    This is an indoor facility, so weather conditions won't affect your activities.
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
                    {weather.hasAlert ? 
                      "Be prepared for adverse weather conditions at this outdoor facility." : 
                      "Weather looks suitable for outdoor activities at this facility."}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ResidentDashboard component
const ResidentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [maintenanceReports, setMaintenanceReports] = useState<any[]>([])
  const [loading, setLoading] = useState({
    bookings: true,
    events: true,
    notifications: true,
    maintenance: true,
    weather: false
  })
  const [error, setError] = useState<string | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  // Store weather data mapped by standard location
  const [weatherMapping, setWeatherMapping] = useState<{ [key: string]: WeatherData }>({});
  const [forecast,setForecast] = useState<{[key:string]:Forecast}>({})

  // Replace the existing fetchWeatherData function with this one
  const fetchWeatherAndForecast = async (locations: string[]) => {
    setLoading(prev => ({ ...prev, weather: true }));
    setWeatherError(null);
    
    try {
      const promises = locations.map(async (location) => {
        const standardLocation = mapCustomLocationToStandard(location);
        console.log("Fetching weather and forecast for:", standardLocation);
        
        try {
          // Fetch current weather and forecast in parallel
          const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(
              `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(standardLocation)}&appid=${OPENWEATHER_API_KEY}&units=metric`
            ),
            fetch(
              `${OPENWEATHER_BASE_URL}/forecast?q=${encodeURIComponent(standardLocation)}&appid=${OPENWEATHER_API_KEY}&units=metric`
            )
          ]);

          if (!weatherResponse.ok || !forecastResponse.ok) {
            throw new Error('API request failed');
          }

          const [weatherData, forecastData] = await Promise.all([
            weatherResponse.json(),
            forecastResponse.json()
          ]);

          console.log("Weather data:", weatherData);
          console.log("Forecast data:", forecastData);

          // Process forecast data to get daily forecasts
          const processedForecasts = forecastData.list.reduce((days: any[], item: ForecastData) => {
            const date = item.dt_txt.split(' ')[0];
            if (!days.find((day: any) => day.date === date)) {
              days.push({
                date,
                temp: Math.round(item.main.temp),
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                humidity: item.main.humidity,
                windSpeed: Math.round(item.wind.speed * 3.6) // Convert m/s to km/h
              });
            }
            return days;
          }, []).slice(0, 5); // Get next 5 days

          // Calculate temperature range
          const temps = processedForecasts.map((day: { temp: any }) => day.temp);
          const temperatureRange = {
            min: Math.min(...temps),
            max: Math.max(...temps)
          };

          // Fix: Check if there's any severe weather in the forecast - this is trying to parse the icon as a number
          const hasAlert = processedForecasts.some((day: { icon: string; weather?: any }) => {
            return day.weather && day.weather[0] && day.weather[0].id < 700;
          });

          let alertMessage = null;
          if (hasAlert) {
            const alertConditions = processedForecasts.filter((day: { weather?: any }) => {
              return day.weather && day.weather[0] && day.weather[0].id < 700;
            });
            if (alertConditions.length > 0) {
              alertMessage = `Expect ${alertConditions[0].description} in the next days`;
            }
          }

          const hasWeatherAlert = weatherData.weather.some((condition: any) => condition.id < 700);
          
          return {
            weather: {
              facilityName: weatherData.name,
              location: standardLocation,
              temperature: Math.round(weatherData.main.temp),
              weatherDescription: weatherData.weather[0].description,
              weatherIcon: weatherData.weather[0].icon,
              hasAlert: hasWeatherAlert // Use the correct variable
            },
            forecast: {
              daily: processedForecasts,
              temperatureRange: temperatureRange,
              alert: alertMessage || undefined
            }
          };
        } catch (err) {
          console.error(`Error fetching data for ${standardLocation}:`, err);
          return null;
        }
      });

      const results = await Promise.all(promises);
      
      const weatherMap: { [key: string]: WeatherData } = {};
      const forecastMap: { [key: string]: Forecast } = {};
      
      results.forEach(result => {
        if (result) {
          weatherMap[result.weather.location] = result.weather;
          forecastMap[result.weather.location] = result.forecast;
        }
      });

      setWeatherMapping(weatherMap);
      setForecast(forecastMap);
    } catch (err) {
      setWeatherError("Failed to load weather data. Please try again later.");
    } finally {
      setLoading(prev => ({ ...prev, weather: false }));
    }
  };

  // Update the fetchDashboardData function to fetch both bookings and facilities
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch bookings and facilities in parallel
        const [bookingsResponse, facilitiesResponse] = await Promise.all([
          api.get<{ data: Booking[] }>("/bookings/my-bookings"),
          api.get<{ data: Facility[] }>("/facilities")
        ]);
  
        console.log("Raw bookings:", bookingsResponse.data.data);
        console.log("Raw facilities:", facilitiesResponse.data.data);
  
        const activeBookingsWithFacilities = getActiveBookingsWithFacilities(
          bookingsResponse.data.data,
          facilitiesResponse.data.data
        );
  
        console.log("Active bookings with facilities:", activeBookingsWithFacilities);
  
        // Get unique locations for weather fetching
        const locations = Array.from(
          new Set(
            activeBookingsWithFacilities
              .map(booking => booking.facility?.location)
              .filter((location): location is string => !!location)
          )
        );
  
        console.log("Unique locations for weather fetch:", locations);
  
        if (locations.length > 0) {
          await fetchWeatherAndForecast(locations);
        }
  
        // Update bookings state
        setBookings(
          activeBookingsWithFacilities.map(booking => ({
            booking_id: booking.booking_id,
            facility_id: booking.facility_id,
            facility: booking.facility,
            date: booking.date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status,
            purpose: booking.purpose,
            attendees: booking.attendees,
          }))
        );
  
        setLoading(prev => ({ ...prev, bookings: false }));
  
        // Fetch and update events, notifications, and maintenance as before
  
        const eventsResponse = await api.get("/events")
        setEvents(
          eventsResponse.data.data.slice(0, 5).map((event: any) => ({
            id: event.event_id,
            title: event.title,
            subtitle: event.facility?.name || "Community Event",
            date: `${new Date(event.start_date).toLocaleDateString()} • ${event.start_time}`,
            status: event.status,
            statusColor: getStatusColor(event.status),
            rawData: event,
          }))
        );
        setLoading(prev => ({ ...prev, events: false }));
  
        const notificationsResponse = await api.get("/notifications")
        setNotifications(
          notificationsResponse.data.data.slice(0, 5).map((notification: any) => ({
            id: notification.notification_id,
            title: notification.title,
            subtitle: notification.message,
            date: new Date(notification.created_at).toLocaleDateString(),
            status: notification.read ? "Read" : "Unread",
            statusColor: notification.read ? "default" : "info",
            rawData: notification,
          }))
        );
        setLoading(prev => ({ ...prev, notifications: false }));
  
        const maintenanceResponse = await api.get("/maintenance/my-reports")
        setMaintenanceReports(
          maintenanceResponse.data.data.slice(0, 5).map((report: any) => ({
            id: report.report_id,
            title: report.title,
            subtitle: report.facility?.name || "Maintenance Report",
            date: new Date(report.reported_date).toLocaleDateString(),
            status: report.status,
            statusColor: getMaintenanceStatusColor(report.status),
            rawData: report,
          }))
        );
        setLoading(prev => ({ ...prev, maintenance: false }));
  
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      }
    }
  
    fetchDashboardData()
  }, [])
  
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "completed":
      case "open":
        return "success"
      case "pending":
      case "in-progress":
      case "scheduled":
        return "warning"
      case "rejected":
      case "cancelled":
      case "closed":
        return "error"
      default:
        return "default"
    }
  }
  
  const getMaintenanceStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success"
      case "in-progress":
      case "scheduled":
        return "warning"
      case "reported":
        return "info"
      default:
        return "default"
    }
  }
  
  const handleCancelBooking = async (bookingId: number) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`)
      const bookingsResponse = await api.get<{ data: Booking[] }>("/bookings/my-bookings")
      setBookings(
        bookingsResponse.data.data.slice(0, 6).map((booking) => ({
          booking_id: booking.booking_id,
          facility_id: booking.facility_id,
          facility: booking.facility,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          purpose: booking.purpose,
          attendees: booking.attendees,
        }))
      )
    } catch (err) {
      console.error("Error cancelling booking:", err)
    }
  }
  
  const handleRegisterForEvent = async (eventId: number) => {
    try {
      await api.post(`/events/${eventId}/register`)
      const eventsResponse = await api.get("/events")
      setEvents(
        eventsResponse.data.data.slice(0, 5).map((event: any) => ({
          id: event.event_id,
          title: event.title,
          subtitle: event.facility?.name || "Community Event",
          date: `${new Date(event.start_date).toLocaleDateString()} • ${event.start_time}`,
          status: event.status,
          statusColor: getStatusColor(event.status),
          rawData: event,
        }))
      )
    } catch (err) {
      console.error("Error registering for event:", err)
    }
  }
  
  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      const notificationsResponse = await api.get("/notifications")
      setNotifications(
        notificationsResponse.data.data.slice(0, 5).map((notification: any) => ({
          id: notification.notification_id,
          title: notification.title,
          subtitle: notification.message,
          date: new Date(notification.created_at).toLocaleDateString(),
          status: notification.read ? "Read" : "Unread",
          statusColor: notification.read ? "default" : "info",
          rawData: notification,
        }))
      )
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }
  
  const activeBookingsCount = bookings.filter(
    (b) => b.status === "approved" || b.status === "pending"
  ).length
  
  const upcomingEventsCount = events.filter(
    (e) => e.rawData.status === "upcoming"
  ).length
  
  const unreadNotificationsCount = notifications.filter(
    (n) => !n.rawData.read
  ).length
  
  const pendingMaintenanceCount = maintenanceReports.filter(
    (m) => m.rawData.status !== "completed"
  ).length

  // Get unique facilities from active bookings (ensure facility exists)
  const uniqueFacilities: Facility[] = Array.from(
    new Map(bookings
      .filter(b => b.facility)
      .map(b => [b.facility!.facility_id, b.facility])
    ).values()
  ).filter((facility): facility is Facility => facility !== undefined);

 // 📅 For Calendar

 console.log("All bookings raw:", bookings);
//@ts-ignore
const bookingDates = bookings
  .filter((b) => b?.date && (b.status === "approved" || b.status === "pending"))
  .map((b) => ({
    date: new Date(new Date(b.date).setHours(0, 0, 0, 0)),
    status: b.status,
  }));

  console.log("Booking dates for calendar:", bookingDates);



  const CustomDay = (props: any) => {
    const { day, outsideCurrentMonth, ...other } = props;
  
    const normalizedDay = new Date(day);
    normalizedDay.setHours(0, 0, 0, 0);
  
    const booking = bookingDates.find((b) => isSameDay(b.date, normalizedDay));

    // eslint-disable-next-line
    let backgroundColor = "";
    let hoverColor = "";
  
    if (booking) {
      if (booking.status === "approved") {
        backgroundColor = "green";
        hoverColor = "darkgreen";
      } else if (booking.status === "pending") {
        backgroundColor = "orange";
        hoverColor = "darkorange";
      }
    }
    const isApprovedDay = bookingDates.some((booking) => isSameDay(booking.date, day) && booking.status === "approved");
    const isPendingDay = bookingDates.some((booking) => isSameDay(booking.date, day) && booking.status === "pending");
    
    return (
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        sx={{
          ...(isApprovedDay && {
           backgroundColor: backgroundColor,
            color: "white",
            "&:hover": {
              backgroundColor: hoverColor,
            },
          }),
          ...(isPendingDay && {
            backgroundColor: "orange",
            color: "white",
            "&:hover": {
              backgroundColor: "darkorange",
            },
          }),
        }}
      />
    );
    
  }
  

  
  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name?.split(" ")[0] || "Resident"}
      </Typography>
  
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
  
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Active Bookings" value={activeBookingsCount} icon={<CalendarIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Upcoming Events" value={upcomingEventsCount} icon={<EventIcon />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Unread Notifications"
            value={unreadNotificationsCount}
            icon={<NotificationIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Maintenance"
            value={pendingMaintenanceCount}
            icon={<MaintenanceIcon />}
            color="#9c27b0"
          />
        </Grid>

        
  
        {/* Weather Alerts */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, bgcolor: 'background.default' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3 
            }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Facility Weather Updates
              </Typography>
              {!loading.weather && (
                <Chip
                  icon={<NotificationIcon />}
                  label={`${Object.keys(weatherMapping).length} Active Updates`}
                  color="primary"
                />
              )}
            </Box>
  
            {loading.weather && (
              <Alert severity="info" sx={{ mb: 2 }}>Loading weather data...</Alert>
            )}
            {weatherError && (
              <Alert severity="error" sx={{ mb: 2 }}>{weatherError}</Alert>
            )}
  
            <Grid container spacing={2}>
              {uniqueFacilities.map((facility) => {
                const standardLocation = mapCustomLocationToStandard(facility.location);
                const weather = weatherMapping[standardLocation];
                const facilityForecast = forecast[standardLocation];
                
                return weather ? (
                  <Grid item xs={12} sm={6} md={4} key={facility.facility_id}>
                    <WeatherCard 
                      facility={facility} 
                      weather={weather}
                      forecast={facilityForecast}
                    />
                  </Grid>
                ) : null;
              })}
              {!loading.weather && Object.keys(weatherMapping).length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">No active facility bookings with weather information</Alert>
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>
  
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<SportsIcon />} onClick={() => navigate("/bookings/create")}>
                  Book Facility
                </Button>
                <Button variant="outlined" startIcon={<EventIcon />} onClick={() => navigate("/events")}>
                  Browse Events
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MaintenanceIcon />}
                  onClick={() => navigate("/maintenance/create")}
                >
                  Report Issue
                </Button>
                <Button variant="outlined" startIcon={<NotificationIcon />} onClick={() => navigate("/notifications")}>
                  View Notifications
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
  
        {/* Recent Bookings */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Recent Bookings"
            activities={bookings.map(b => ({
              id: b.booking_id,
              title: b.facility?.name || "Facility Booking",
              subtitle: `${b.purpose} (${b.attendees} attendees)`,
              date: `${new Date(b.date).toLocaleDateString()} • ${b.start_time} - ${b.end_time}`,
              status: b.status,
              statusColor: getStatusColor(b.status),
              rawData: b,
            }))}
            emptyMessage="No bookings found"
            loading={loading.bookings}
            viewAllLink="/bookings"
            renderActions={(booking) => (
              (booking.rawData.status === "approved" || booking.rawData.status === "pending") ? (
                <ButtonGroup size="small" variant="outlined">
                  <Button color="primary" onClick={() => navigate(`/bookings/${booking.id}`)}>
                    View
                  </Button>
                  <Button
                    color="error"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={booking.rawData.status === "cancelled"}
                  >
                    Cancel
                  </Button>
                </ButtonGroup>
              ) : null
            )}
          />
        </Grid>

       {/* Calendar View */}
       <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Calendar View
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                disablePast={false}
                slots={{
                  day: CustomDay,
                }}
              />
            </LocalizationProvider>
          </CardContent>
        </Card>
      </Grid>


  
        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Upcoming Events"
            activities={events}
            emptyMessage="No upcoming events"
            loading={loading.events}
            viewAllLink="/events"
            renderActions={(event) => (
              event.rawData.status === "upcoming" ? (
                <ButtonGroup size="small" variant="outlined">
                  <Button color="primary" onClick={() => navigate(`/events/${event.id}`)}>
                    View
                  </Button>
                  <Button color="success" onClick={() => handleRegisterForEvent(event.id)}>
                    Register
                  </Button>
                </ButtonGroup>
              ) : null
            )}
          />
        </Grid>
  
        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Recent Notifications"
            activities={notifications}
            emptyMessage="No notifications"
            loading={loading.notifications}
            viewAllLink="/notifications"
            renderActions={(notification) => (
              !notification.rawData.read ? (
                <Button size="small" variant="outlined" onClick={() => handleMarkNotificationAsRead(notification.id)}>
                  Mark as Read
                </Button>
              ) : null
            )}
          />
        </Grid>
  
        {/* Maintenance Reports */}
        <Grid item xs={12} md={6}>
          <RecentActivityList
            title="Maintenance Reports"
            activities={maintenanceReports}
            emptyMessage="No maintenance reports"
            loading={loading.maintenance}
            viewAllLink="/maintenance"
            renderActions={(report) => (
              <Button size="small" variant="outlined" onClick={() => navigate(`/maintenance/${report.id}`)}>
                View Details
              </Button>
            )}
          />
        </Grid>
      </Grid>
    </section>
    
  )

  
}
  
export default ResidentDashboard