export interface WeatherData {
    facilityName: string
    location: string
    temperature: number
    weatherDescription: string
    weatherIcon: string
    hasAlert: boolean
  }
  
  export interface Facility {
    facility_id: number
    name: string
    location: string
    status: string
    is_indoor?: boolean
  }
  
  export interface Booking {
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
  
  export interface ForecastData {
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
  
  export interface Forecast {
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
  
  export interface ActivityItem {
    id: number;
    title: string;
    subtitle: string;
    date: string;
    status: string;
    statusColor: string;
    rawData: any;
  }