"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Search as SearchIcon, Event as EventIcon } from "@mui/icons-material"
import { api } from "@/services/api"

interface Event {
  event_id: number
  title: string
  description: string
  facility: {
    name: string
    facility_id: number
  }
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
  image_url: string
  max_attendees: number
  current_attendees: number
}

const EventsPage = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get("/events")
        setEvents(response.data.data)
        setFilteredEvents(response.data.data)
      } catch (err) {
        console.error("Error fetching events:", err)
        setError("Failed to load events. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    // Filter events based on search term
    if (searchTerm) {
      const filtered = events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.facility?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredEvents(filtered)
    } else {
      setFilteredEvents(events)
    }
  }, [searchTerm, events])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return "success"
      case "ongoing":
        return "warning"
      case "completed":
        return "default"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString()
    }

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  return (
    <section>
      <Typography variant="h4" component="h1" gutterBottom>
        Community Events
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Search events"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredEvents.length > 0 ? (
        <Grid container spacing={3}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.event_id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/events/${event.event_id}`)}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={event.image_url || "/placeholder.svg?height=160&width=320"}
                    alt={event.title}
                  />
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {event.title}
                      </Typography>
                      <Chip label={event.status} size="small" color={getStatusColor(event.status) as any} />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDateRange(event.start_date, event.end_date)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {event.facility?.name} • {event.start_time} - {event.end_time}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {event.description.length > 100 ? `${event.description.substring(0, 100)}...` : event.description}
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        {event.current_attendees}/{event.max_attendees} attendees
                      </Typography>
                      {event.status === "upcoming" && (
                        <Chip
                          label={event.current_attendees >= event.max_attendees ? "Fully Booked" : "Registration Open"}
                          size="small"
                          color={event.current_attendees >= event.max_attendees ? "error" : "success"}
                        />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
          <Typography color="text.secondary">Try adjusting your search or check back later for new events.</Typography>
        </Box>
      )}
    </section>
  )
}

export default EventsPage
