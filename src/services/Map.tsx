import { useState, useEffect, useRef } from 'react';

// Extend the Window interface to include the google property
declare global {
  interface Window {
    google: typeof google;
  }
}

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  MyLocation,
  DirectionsCar,
  DirectionsWalk,
  DirectionsBike,
  Train,
  Share,
  Fullscreen,
  Close,
} from '@mui/icons-material';


interface FacilityProps {
  location: string;
}

type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

const LocationMap = ({ Facility }: { Facility: FacilityProps }) => {
  const [origin, setOrigin] = useState<string>('current location');
  const [manualOrigin, setManualOrigin] = useState<string>('');
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');

  const [fullScreen, setFullScreen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const MAP_API = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const DESTINATION = encodeURIComponent(Facility.location || '');

  useEffect(() => {
 

  
  }, [origin, travelMode, DESTINATION, MAP_API]);

  useEffect(() => {
    const savedLocations = localStorage.getItem('recentLocations');
    if (savedLocations) setRecentLocations(JSON.parse(savedLocations));
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps) {
      const input = document.getElementById('location-autocomplete') as HTMLInputElement;
      if (input) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
          types: ['geocode'],
        });
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            setManualOrigin(place.formatted_address);
          }
        });
      }
    }
  }, []);

  const handleGetLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setOrigin(`${latitude},${longitude}`);
          addRecentLocation(`Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
          setIsLoading(false);
        },
        (error) => {
          setError(`Failed to get location: ${error.message}`);
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported in this browser.');
      setIsLoading(false);
    }
  };

  const handleManualOriginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualOrigin.trim()) {
      setOrigin(encodeURIComponent(manualOrigin.trim()));
      addRecentLocation(manualOrigin.trim());
    }
  };

  const addRecentLocation = (location: string) => {
    const updatedLocations = [location, ...recentLocations.filter(loc => loc !== location)].slice(0, 5);
    setRecentLocations(updatedLocations);
    localStorage.setItem('recentLocations', JSON.stringify(updatedLocations));
  };

  const handleShare = () => {
    const url = `https://maps.google.com/maps?dir/?api=1&destination=${encodeURIComponent(Facility.location)}&origin=${origin}&travelmode=${travelMode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Directions',
        text: `Check out these directions to ${Facility.location}`,
        url: url,
      }).catch((error) => {
        setError('Sharing failed: ' + error.message);
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setError('');
        alert('Link copied to clipboard! You can share it via WhatsApp, email, or any social media.');
      });
    }
  };

  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  const handleCloseError = () => {
    setError('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2, position: 'relative' }}>
      <Typography variant="h6" gutterBottom>
        View on Map
      </Typography>

      {recentLocations.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {recentLocations.map((loc) => (
            <Chip
              key={loc}
              label={loc}
              onClick={() => setOrigin(encodeURIComponent(loc))}
              onDelete={() => setRecentLocations(recentLocations.filter(l => l !== loc))}
              deleteIcon={<Close fontSize="small" />}
              size="small"
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<MyLocation />}
          onClick={handleGetLocation}
          disabled={isLoading}
        >
          {isLoading ? 'Locating...' : 'Use My Location'}
        </Button>

        <Box component="form" onSubmit={handleManualOriginSubmit} sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          <TextField
            id="location-autocomplete"
            size="small"
            placeholder="Enter starting address"
            value={manualOrigin}
            onChange={(e) => setManualOrigin(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={!manualOrigin.trim()}>
            Go
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Tooltip title="Driving">
          <IconButton onClick={() => setTravelMode('driving')} color={travelMode === 'driving' ? 'primary' : 'default'}>
            <DirectionsCar />
          </IconButton>
        </Tooltip>
        <Tooltip title="Walking">
          <IconButton onClick={() => setTravelMode('walking')} color={travelMode === 'walking' ? 'primary' : 'default'}>
            <DirectionsWalk />
          </IconButton>
        </Tooltip>
        <Tooltip title="Biking">
          <IconButton onClick={() => setTravelMode('bicycling')} color={travelMode === 'bicycling' ? 'primary' : 'default'}>
            <DirectionsBike />
          </IconButton>
        </Tooltip>
        <Tooltip title="Transit">
          <IconButton onClick={() => setTravelMode('transit')} color={travelMode === 'transit' ? 'primary' : 'default'}>
            <Train />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ position: 'relative', height: fullScreen ? '100vh' : '400px', mb: 2 }}>
        <iframe
          title="Directions Map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/directions?key=${MAP_API}&destination=${encodeURIComponent(
            Facility.location || ''
          )}&origin=${origin}&mode=${travelMode}`}
          allowFullScreen
        />

        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
         
          <Tooltip title="Share Directions">
            <IconButton onClick={handleShare} sx={{ bgcolor: 'background.paper' }}>
              <Share />
            </IconButton>
          </Tooltip>
          <Tooltip title={fullScreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton onClick={toggleFullScreen} sx={{ bgcolor: 'background.paper' }}>
              <Fullscreen />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationMap;