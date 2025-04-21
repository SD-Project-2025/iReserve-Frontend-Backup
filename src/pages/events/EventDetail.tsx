import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

interface Facility {
  facility_id: number;
  name: string;
  location: string;
  capacity: number;
  image_url: string;
}

interface Organizer {
  staff_id: number;
  employee_id: string;
  position: string;
}

interface EventData {
  event_id: number;
  title: string;
  description: string;
  facility_id: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  organizer_staff_id: number;
  status: string;
  capacity: number;
  image_url: string;
  is_public: boolean;
  registration_deadline: string;
  fee: string;
  Facility: Facility;
  organizer: Organizer;
  registrations: number;
  is_registered?: boolean;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/v1/events/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setEvent(data.data);
          setIsRegistered(data.data.is_registered || false);
        } else {
          setError("Event not found.");
        }
      } catch (err) {
        setError("Could not load event.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/events/${id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const result = await response.json();
      if (response.ok) {
        setIsRegistered(true);
        alert("Successfully registered!");
      } else {
        alert(result.message || "Registration failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Error during registration.");
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/events/${id}/cancel-registration`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const result = await response.json();
      if (response.ok) {
        setIsRegistered(false);
        alert("Registration cancelled.");
      } else {
        alert(result.message || "Cancel failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Error cancelling registration.");
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error || !event) {
    return <Typography color="error">{error || "Could not load event."}</Typography>;
  }

  const remainingCapacity = event.Facility?.capacity && event.registrations !== undefined
    ? event.Facility.capacity - event.registrations
    : "N/A";

  return (
    <Card sx={{ maxWidth: 900, m: "auto", mt: 4 }}>
      {/* Event Image - Using CardMedia with priority to event image */}
      {(event.image_url || event.Facility?.image_url) && (
        <CardMedia
          component="img"
          height="350"
          image={event.image_url || event.Facility?.image_url}
          alt={event.title}
          sx={{ objectFit: "cover" }}
        />
      )}
      
      <CardContent>
        <Typography variant="h4" gutterBottom>
          {event.title}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          <Chip label={`Start: ${event.start_date}`} color="primary" />
          <Chip label={`End: ${event.end_date}`} />
          <Chip 
            label={event.status} 
            color={event.status === "active" ? "success" : "warning"} 
          />
          <Chip label={`Fee: R${event.fee}`} />
        </Box>

        <Typography variant="body1" paragraph>
          {event.description}
        </Typography>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 3
        }}>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">Location</Typography>
            <Typography variant="body1">{event.Facility?.location}</Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" color="text.secondary">Facility</Typography>
            <Typography variant="body1">{event.Facility?.name}</Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" color="text.secondary">Time</Typography>
            <Typography variant="body1">{event.start_time} - {event.end_time}</Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" color="text.secondary">Capacity</Typography>
            <Typography variant="body1">
              {remainingCapacity} of {event.Facility?.capacity} spots remaining
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" color="text.secondary">Registration Deadline</Typography>
            <Typography variant="body1">{event.registration_deadline}</Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" color="text.secondary">Organizer</Typography>
            <Typography variant="body1">
              {event.organizer?.position} ({event.organizer?.employee_id})
            </Typography>
          </Box>
        </Box>

        {user?.type === "resident" && (
          <Button
            variant="contained"
            color={isRegistered ? "error" : "primary"}
            fullWidth
            size="large"
            onClick={isRegistered ? handleCancel : handleRegister}
            sx={{ 
              py: 2,
              fontWeight: 'bold',
              fontSize: '1rem',
              mt: 2
            }}
          >
            {isRegistered ? "Cancel Registration" : "Register Now"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EventDetail;