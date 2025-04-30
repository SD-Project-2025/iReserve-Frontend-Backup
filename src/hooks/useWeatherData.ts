import { useState } from "react";
import { Booking, WeatherData, Forecast } from "../types/dashboardTypes";
import { OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL, mapCustomLocationToStandard } from "../utils/dashboardUtils";

export const useWeatherData = (bookings: Booking[]) => {
  const [weatherMapping, setWeatherMapping] = useState<{ [key: string]: WeatherData }>({});
  const [forecast, setForecast] = useState<{ [key: string]: Forecast }>({});
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeatherAndForecast = async (locations: string[]) => {
    setLoading(true);
    setWeatherError(null);
    
    try {
      const promises = locations.map(async (location) => {
        const standardLocation = mapCustomLocationToStandard(location);
        
        try {
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

          const processedForecasts = forecastData.list.reduce((days: any[], item: any) => {
            const date = item.dt_txt.split(' ')[0];
            if (!days.find((day: any) => day.date === date)) {
              days.push({
                date,
                temp: Math.round(item.main.temp),
                description: item.weather[0].description,
                icon: item.weather[0].icon,
                humidity: item.main.humidity,
                windSpeed: Math.round(item.wind.speed * 3.6)
              });
            }
            return days;
          }, []).slice(0, 5);

          const temps = processedForecasts.map((day: { temp: any }) => day.temp);
          const temperatureRange = {
            min: Math.min(...temps),
            max: Math.max(...temps)
          };

          const hasAlert = processedForecasts.some((day: { weather?: any }) => {
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
              hasAlert: hasWeatherAlert
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
      setLoading(false);
    }
  };

  return {
    weatherMapping,
    forecast,
    weatherError,
    loading,
    fetchWeatherAndForecast
  };
};