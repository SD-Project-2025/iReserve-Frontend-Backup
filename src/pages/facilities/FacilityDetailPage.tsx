import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { useAuth } from "../../contexts/AuthContext"
import {
  Box,
  Button,
  Typography,
  Rating,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Chip,
  TextField,
} from "@mui/material"

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
}

const FacilityDetailPage = () => {
  const { facilityId } = useParams<{ facilityId: string }>()
  const { user } = useAuth()

  const [facility, setFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRating, setUserRating] = useState<number | null>(null)
  const [comment, setComment] = useState<string>("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await axios.get<{ success: boolean; message: string; data: Facility }>(
          `http://localhost:5000/api/v1/facilities/${facilityId}`
        )
        if (response.data.success) {
          setFacility(response.data.data)
          setUserRating(response.data.data.average_rating ?? null)
        } else {
          setError("Facility not found.")
        }
      } catch (err) {
        setError("Could not load facility or ratings.")
      } finally {
        setLoading(false)
      }
    }

    fetchFacility()
  }, [facilityId])

  const handleRatingSubmit = async () => {
    if (userRating == null) return
    try {
      setUpdating(true)
      await axios.post(`http://localhost:5000/api/v1/facilityRatings/${facilityId}`, {
        rating: userRating,
        comment,
        userId: user?.id,
      })
      alert("Rating submitted successfully.")
    } catch (err) {
      console.error("Rating submission failed", err)
      alert("Rating failed.")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <CircularProgress sx={{ m: 4 }} />
  if (error || !facility) {
    return <Typography color="error">{error || "Could not load facility or ratings."}</Typography>
  }

  return (
    <Card sx={{ maxWidth: 900, m: "auto", mt: 4 }}>
      {facility.image_url && (
        <CardMedia
          component="img"
          height="350"
          image={facility.image_url}
          alt={facility.name}
        />
      )}
      <CardContent>
        <Typography variant="h4" gutterBottom>
          {facility.name}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <Chip label={facility.type} color="primary" />
          <Chip label={facility.status} color={facility.status === "open" ? "success" : "warning"} />
          <Chip label={facility.is_indoor ? "Indoor" : "Outdoor"} />
        </Box>

        <Typography variant="body1" gutterBottom>
          <strong>Location:</strong> {facility.location}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Capacity:</strong> {facility.capacity}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Description:</strong> {facility.description || "No description provided."}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Opening Hours:</strong> {facility.open_time} - {facility.close_time}
        </Typography>

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Average Rating:
          </Typography>
          {facility.average_rating != null ? (
            <>
              <Rating value={facility.average_rating} precision={0.5} readOnly />
              <Typography variant="body2">({facility.average_rating}/5)</Typography>
            </>
          ) : (
            <Typography color="text.secondary" fontStyle="italic">
              Facility has not been rated yet.
            </Typography>
          )}
        </Box>

        {user?.type === "resident" && (
          <Box mt={4}>
            <Typography gutterBottom>Your Rating:</Typography>
            <Rating
              name="resident-rating"
              value={userRating}
              precision={0.5}
              onChange={(e, newValue) => setUserRating(newValue)}
            />

            <TextField
              label="Your Comment"
              multiline
              fullWidth
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mt: 2 }}
            />

            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleRatingSubmit}
              disabled={updating}
            >
              {facility.average_rating ? "Update Rating" : "Submit Rating"}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default FacilityDetailPage
