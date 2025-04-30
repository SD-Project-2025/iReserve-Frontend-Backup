import { Booking, Facility } from "../types/dashboardTypes";

export const OPENWEATHER_API_KEY = "503990715e3d001d29e30e6113559cee";
export const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

export const getActiveBookingsWithFacilities = (bookings: Booking[], facilities: Facility[]) => {
  const today = new Date().toISOString().split('T')[0];
  return bookings
    .filter(booking => 
      (booking.status === "approved" || booking.status === "pending") &&
      booking.date >= today
    )
    .map(booking => ({
      ...booking,
      facility: facilities.find(f => f.facility_id === booking.facility_id)
    }))
    .filter(booking => 
      booking.facility && booking.facility.status === "open"
    );
};

export const mapCustomLocationToStandard = (customLocation: string): string => {
  console.log("Mapping location:", customLocation);
  const lower = customLocation.toLowerCase();
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

  if (lower.includes('randburg')) return 'Randburg, South Africa';
  if (lower.includes('sandton')) return 'Sandton, South Africa';
  if (lower.includes('rosebank')) return 'Rosebank, Johannesburg, South Africa';
  if (lower.includes('fourways')) return 'Fourways, Johannesburg, South Africa';
  
  return 'Johannesburg, South Africa';
};

export const getStatusColor = (status?: string) => {
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

export const getMaintenanceStatusColor = (status?: string) => {
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