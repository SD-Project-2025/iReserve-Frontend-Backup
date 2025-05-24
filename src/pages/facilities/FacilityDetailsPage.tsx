"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Rating,
  TextField,
  Snackbar,
} from "@mui/material"
import {
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Event as EventIcon,
  Star as StarIcon,
  Comment as CommentIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import LocationMap from "@/services/Map"

interface Facility {
  facility_id: number
  name: string
  type: string
  location: string
  capacity: number
  is_indoor: boolean
  image_url: string
  status: string
  description: string
  open_time: string
  close_time: string
  average_rating?: number
  FacilityRatings?: Rating[]
}

interface Booking {
  booking_id: number
  date: string
  start_time: string
  end_time: string
  status: string
}

interface Event {
  event_id: number
  title: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  status: string
}

interface Rating {
  rating_id: number
  user_id: number
  rating: number
  comment: string
  created_at: string
}

const FacilityDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [facility, setFacility] = useState<Facility | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [comment, setComment] = useState<string>("")
  const [ratingLoading, setRatingLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [residentNames, setResidentNames] = useState<Record<number, string>>({});

  useEffect(() => {

    const fetchFacilityDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const facilityResponse = await api.get(`/facilities/${id}`)
        console.log("Fetched facility data:", facilityResponse.data)
        
        if (!facilityResponse.data?.success) {
          throw new Error(facilityResponse.data?.message || "Failed to fetch facility")
        }

        const facilityData = facilityResponse.data.data
        if (!facilityData) {
          throw new Error("Facility data not found")
        }

        setFacility(facilityData)
        setRatings(facilityData.FacilityRatings || [])
        // Get resident names for ratings
        if (facilityData.FacilityRatings?.length) {
          const userIds = facilityData.FacilityRatings.map((r: Rating) => r.user_id);
          const namesResponse = await api.post('/residents/names', { user_ids: userIds });
          
          if (namesResponse.data?.success) {
            setResidentNames(namesResponse.data.data);
          }
        }
        
        try {
          const bookingsResponse = await api.get(`/facilities/${id}/bookings`)
          setBookings(bookingsResponse.data?.data || [])
        } catch (bookingsError) {
          console.warn("Failed to fetch bookings:", bookingsError)
          setBookings([])
        }

        try {
          const eventsResponse = await api.get(`/facilities/${id}/events`)
          setEvents(eventsResponse.data?.data || [])
        } catch (eventsError) {
          console.warn("Failed to fetch events:", eventsError)
          setEvents([])
        }

      } catch (err: any) {
        console.error("Error fetching facility details:", err)
        setError(err.response?.data?.message || err.message || "Failed to load facility details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchFacilityDetails()
    } else {
      setError("Facility ID is missing")
      setLoading(false)
    }
  }, [id])

  const getResidentName = (userId: number): string => {
    return residentNames[userId] || `User ${userId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "success"
      case "closed":
        return "error"
      case "maintenance":
        return "warning"
      case "upcoming":
        return "info"
      case "ongoing":
        return "warning"
      case "completed":
        return "default"
      case "approved":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  const handleBookFacility = () => {
    if (!facility) return

    if (facility.status !== "open") {
      setError("This facility is not available for booking at the moment.")
      return
    }

    if (user?.type === "resident") {
      navigate("/bookings/create", { state: { facilityId: facility.facility_id } })
    } else {
      setBookingDialogOpen(true)
    }
  }

  const handleReportIssue = () => {
    if (!facility) return
    navigate("/maintenance/create", { state: { facilityId: facility.facility_id } })
  }

  const handleRatingSubmit = async () => {
    if (userRating === null) return
    
    try {
      setRatingLoading(true)
      const response = await api.post(`/facilities/ratings`, {
        facility_id: id,
        rating: userRating,
        comment,
        user_id: user?.id
      })

      if (response.data.success) {
        const facilityResponse = await api.get(`/facilities/${id}`)
        setFacility(facilityResponse.data.data)
        setComment("")
        setUserRating(null)
        await api.post("/notifications", {
        title: "Rating Submitted",
        message: `You have successfully rated the facility ${facility?.name}.`,
        type: "event",
        related_id: id,
        related_type: "event",
        })
        setSuccess("Rating submitted successfully!")
      }
    } catch (err: any) {
      console.error("Error submitting rating:", err)
      setError(err.response?.data?.message || "Failed to submit rating. Please try again.")
    } finally {
      setRatingLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    if (id) {
      setLoading(true)
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRetry}>
          Retry
        </Button>
      </Box>
    )
  }

  if (!facility) {
    return (
      <Alert severity="info" sx={{ m: 3 }}>
        Facility not found.
      </Alert>
    )
  }

  const hasRatings = ratings && ratings.length > 0
  const averageRating = facility.average_rating !== undefined ? facility.average_rating : null

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {facility.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label={facility.status} 
            color={getStatusColor(facility.status) as any} 
            sx={{ textTransform: 'capitalize' }} 
          />
          <Typography variant="subtitle1" color="text.secondary">
            {facility.type} • {facility.is_indoor ? "Indoor" : "Outdoor"} • Capacity: {facility.capacity}
          </Typography>
          {averageRating !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <StarIcon color="warning" fontSize="small" />
              <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 0.5 }}>
                {averageRating.toFixed(1)}/5 ({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Box
            component="img"
            src={facility.image_url || "/placeholder-facility.jpg"}
            alt={facility.name}
            sx={{
              width: "100%",
              height: 400,
              objectFit: "cover",
              borderRadius: 2,
              mb: 3,
              backgroundColor: '#f5f5f5'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder-facility.jpg"
            }}
          />

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon color="primary" sx={{ mr: 1 }} />
                About this facility
              </Typography>
              <Typography paragraph>{facility.description}</Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon color="action" sx={{ mr: 1 }} />
                    {facility.location}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon color="action" sx={{ mr: 1 }} />
                    {facility.open_time} - {facility.close_time}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Ratings and Reviews Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon color="primary" sx={{ mr: 1 }} />
                Ratings & Reviews
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {averageRating !== null ? (
                  <>
                    <Rating
                      value={averageRating}
                      precision={0.1}
                      readOnly
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="h6">
                      {averageRating.toFixed(1)} out of 5
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">No ratings yet</Typography>
                )}
              </Box>

              {user?.type === "resident" && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Share Your Experience
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ mr: 2 }}>Your Rating:</Typography>
                    <Rating
                      value={userRating}
                      precision={0.5}
                      onChange={(_, newValue) => {
                        setUserRating(newValue)
                      }}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    label="Your Review"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRatingSubmit}
                    disabled={ratingLoading || userRating === null}
                  >
                    {ratingLoading ? <CircularProgress size={24} /> : "Submit Review"}
                  </Button>
                </Box>
              )}

              {hasRatings ? (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CommentIcon color="primary" sx={{ mr: 1 }} />
                    User Reviews
                  </Typography>
                  {ratings.map((rating) => (
                    <Box key={rating.rating_id} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #eee' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontWeight="bold">
                          {getResidentName(rating.user_id)}
                        </Typography>
                        <Typography color="text.secondary">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Rating value={rating.rating} precision={0.5} readOnly size="small" sx={{ mb: 1 }} />
                      <Typography>{rating.comment}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No reviews yet. Be the first to review!</Typography>
              )}
            </CardContent>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarIcon color="primary" sx={{ mr: 1 }} />
            Upcoming Bookings
          </Typography>

          {bookings.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.booking_id}>
                      <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {booking.start_time} - {booking.end_time}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          size="small" 
                          color={getStatusColor(booking.status) as any} 
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              No upcoming bookings for this facility.
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon color="primary" sx={{ mr: 1 }} />
            Upcoming Events
          </Typography>

          {events.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.event_id}>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>
                        {new Date(event.start_date).toLocaleDateString()}
                        {event.start_date !== event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
                      </TableCell>
                      <TableCell>
                        {event.start_time} - {event.end_time}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={event.status} 
                          size="small" 
                          color={getStatusColor(event.status) as any} 
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => navigate(`/events/${event.event_id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No upcoming events for this facility.
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<CalendarIcon />}
              onClick={handleBookFacility}
              disabled={facility.status !== "open"}
              sx={{ minWidth: 200 }}
            >
              Book this Facility
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => navigate("/events", { state: { facilityFilter: facility.facility_id } })}
              sx={{ minWidth: 200 }}
            >
              View All Events
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<InfoIcon />}
              onClick={handleReportIssue}
              sx={{ minWidth: 200 }}
            >
              Report Issue
            </Button>
          </Box>
          <br />
          
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <LocationMap Facility={facility} />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Facility Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ '& > *': { mb: 1.5 } }}>
                <Typography>
                  <strong>Type:</strong> {facility.type}
                </Typography>
                <Typography>
                  <strong>Location:</strong> {facility.location}
                </Typography>
                <Typography>
                  <strong>Capacity:</strong> {facility.capacity}
                </Typography>
                <Typography>
                  <strong>Environment:</strong> {facility.is_indoor ? "Indoor" : "Outdoor"}
                </Typography>
                <Typography>
                  <strong>Operating Hours:</strong> {facility.open_time} - {facility.close_time}
                </Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  <strong>Current Status:</strong> 
                  <Chip 
                    label={facility.status} 
                    size="small" 
                    color={getStatusColor(facility.status) as any} 
                    sx={{ ml: 1, textTransform: 'capitalize' }}
                  />
                </Typography>
                {averageRating !== null && (
                  <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                    <strong>Average Rating:</strong>
                    <Rating
                      value={averageRating}
                      precision={0.1}
                      readOnly
                      size="small"
                      sx={{ ml: 1 }}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({averageRating.toFixed(1)})
                    </Typography>
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)}>
        <DialogTitle>Restricted Access</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Only residents are allowed to book this facility. Please log in as a resident to proceed with the booking.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Close</Button>
          <Button 
            onClick={() => navigate("/login", { state: { from: `/facilities/${id}` } })} 
            color="primary"
            variant="contained"
          >
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>

    
  )
}

export default FacilityDetailsPage