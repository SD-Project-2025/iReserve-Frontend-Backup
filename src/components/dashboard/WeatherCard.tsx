import { useState } from "react";
import { Card, CardContent, Typography, Box, Alert, Button, Chip } from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  Notifications as NotificationIcon,
  WbSunny as SunIcon,
  Cloud as CloudIcon,
  Umbrella as UmbrellaIcon,
  AcUnit as SnowIcon,
  FlashOn as StormIcon,
  Home as HomeIcon
} from "@mui/icons-material";
import { WeatherData, Forecast, Facility } from "../../types/dashboardTypes";

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
        return <SunIcon sx={{ color: '#FFD700' }} />;
      case '02d':
      case '02n':
        return <CloudIcon sx={{ color: '#A9A9A9' }} />;
      case '03d':
      case '03n':
      case '04d':
      case '04n':
        return <CloudIcon sx={{ color: '#808080' }} />;
      case '09d':
      case '09n':
        return <UmbrellaIcon sx={{ color: '#4682B4' }} />;
      case '10d':
      case '10n':
        return <UmbrellaIcon sx={{ color: '#4169E1' }} />;
      case '11d':
      case '11n':
        return <StormIcon sx={{ color: '#483D8B' }} />;
      case '13d':
      case '13n':
        return <SnowIcon sx={{ color: '#B0C4DE' }} />;
      default:
        return <CloudIcon sx={{ color: '#A9A9A9' }} />;
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
        
        <Button 
          fullWidth 
          sx={{ mt: 2 }} 
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show Less" : "Show More Details"}
        </Button>
        
        {expanded && (
          <Box sx={{ mt: 2 }}>
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
            
            {showTab === 'forecast' && forecast && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  overflowX: 'auto',
                  pb: 1
                }}>
                  {forecast.daily.map((day, index) => {
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

export default WeatherCard;