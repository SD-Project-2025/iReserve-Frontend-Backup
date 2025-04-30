import { useState } from 'react';

import { Box, Typography, TextField, Button } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';



interface FacilityProps {
  location: string;
}

const LocationMap = ({ Facility }: { Facility: FacilityProps }) => {
  const [origin, setOrigin] = useState('current location');
 
  const [manualOrigin, setManualOrigin] = useState('');
const MAP_API = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Ensure this is set in your .env file
  
  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setOrigin(`${latitude},${longitude}`);
        },
        (error) => {
          console.error("Error getting location:", error);
          setOrigin('current location'); // Fallback
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setOrigin('current location'); // Fallback
    }
  };

  const handleManualOriginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (manualOrigin.trim()) {
      setOrigin(encodeURIComponent(manualOrigin.trim()));
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
      <Typography variant="h6" gutterBottom>
       View on Map
      </Typography>
      
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<MyLocationIcon />}
          onClick={handleGetLocation}
        >
          Use My Current Location
        </Button>
        
        <Box component="form" onSubmit={handleManualOriginSubmit} sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="Enter starting address"
            value={manualOrigin}
            onChange={(e) => setManualOrigin(e.target.value)}
          />
          <Button type="submit" variant="contained">
            Set Location
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: 300,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <iframe
          title="Directions Map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/directions?key=${MAP_API}&destination=${encodeURIComponent(
            Facility.location || ""
          )}&origin=${origin}`}
          allowFullScreen
        ></iframe>
      </Box>
    </Box>
  );
};

export default LocationMap;