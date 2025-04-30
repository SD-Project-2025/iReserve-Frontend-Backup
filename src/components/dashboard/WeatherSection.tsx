import { Grid, Card, Box, Typography, Chip, Alert } from "@mui/material";
import { Notifications as NotificationIcon } from "@mui/icons-material";
import WeatherCard from "./WeatherCard";
import { Facility, WeatherData, Forecast } from "../../types/dashboardTypes";
import { mapCustomLocationToStandard } from "@/utils/dashboardUtils";

interface WeatherSectionProps {
  facilities: Facility[];
  weatherMapping: { [key: string]: WeatherData };
  forecast: { [key: string]: Forecast };
  loading: boolean;
  error: string | null;
}

const WeatherSection = ({ 
  facilities, 
  weatherMapping, 
  forecast, 
  loading, 
  error 
}: WeatherSectionProps) => {
  return (
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
          {!loading && (
            <Chip
              icon={<NotificationIcon />}
              label={`${Object.keys(weatherMapping).length} Active Updates`}
              color="primary"
            />
          )}
        </Box> 
        {loading && (
          <Alert severity="info" sx={{ mb: 2 }}>Loading weather data...</Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}  
        <Grid container spacing={2}>
          {facilities.map((facility) => {
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
          {!loading && Object.keys(weatherMapping).length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">No active facility bookings with weather information</Alert>
            </Grid>
          )}
        </Grid>
      </Card>
    </Grid>
  );
};

export default WeatherSection;