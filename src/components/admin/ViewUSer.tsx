"use client"

import React from "react";
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Alert,
  Grid,
  CircularProgress,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  
 
  ArrowBack as BackIcon,
  Event as EventIcon,
  Place as FacilityIcon,
  Search as SearchIcon,
  Timeline as StatsIcon,
} from "@mui/icons-material";

interface User {
  user_id: number;
  name: string;
  email: string;
  type: string;
  status: string;
  created_at: string;
}

interface Booking {
  id: number;
  facility: string;
  date: string;
  duration: string;
  status: 'completed' | 'upcoming' | 'cancelled';
}

interface Event {
  id: number;
  name: string;
  date: string;
  attended: boolean;
  rating?: number;
}

interface SearchHistory {
  id: number;
  query: string;
  date: string;
  results: number;
}

interface UserStats {
  bookingsCount: number;
  eventsAttended: number;
  avgSearchResults: number;
  favoriteFacility: string;
  activeHours: string;
}

const ViewUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = React.useState(0);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Mock data for user history
  const [bookings, setBookings] = React.useState<Booking[]>([
    { id: 1, facility: 'Tennis Court', date: '2023-10-15 14:00', duration: '2 hours', status: 'completed' },
    { id: 2, facility: 'Swimming Pool', date: '2023-11-05 09:30', duration: '1 hour', status: 'upcoming' },
    { id: 3, facility: 'Conference Room A', date: '2023-09-20 13:00', duration: '4 hours', status: 'completed' },
    { id: 4, facility: 'Gym', date: '2023-11-12 18:00', duration: '1.5 hours', status: 'cancelled' },
  ]);

  const [events, setEvents] = React.useState<Event[]>([
    { id: 1, name: 'Community BBQ', date: '2023-08-12', attended: true, rating: 4 },
    { id: 2, name: 'Yoga Class', date: '2023-09-15', attended: true, rating: 5 },
    { id: 3, name: 'Annual Meeting', date: '2023-10-20', attended: false },
    { id: 4, name: 'Holiday Party', date: '2023-12-15', attended: false },
  ]);

  const [searchHistory, setSearchHistory] = React.useState<SearchHistory[]>([
    { id: 1, query: 'Tennis lessons', date: '2023-10-14 09:15', results: 12 },
    { id: 2, query: 'Swimming pool schedule', date: '2023-11-01 14:30', results: 5 },
    { id: 3, query: 'Nearby restaurants', date: '2023-09-18 19:45', results: 8 },
    { id: 4, query: 'Event tickets', date: '2023-10-25 11:20', results: 3 },
  ]);

  const [userStats, setUserStats] = React.useState<UserStats>({
    bookingsCount: 8,
    eventsAttended: 5,
    avgSearchResults: 7.2,
    favoriteFacility: 'Tennis Court',
    activeHours: 'Weekdays 18:00-20:00',
  });

  React.useEffect(() => {
    if (location.state?.userData) { //Should get notification preferences from the backend
      // Use the passed user data if available
      setUser(location.state.userData)
      setLoading(false)
    }
  }, [id, location.state]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="warning" sx={{ my: 3 }}>
        No user data available
      </Alert>
    );
  }

  return (
    <section>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate("/admin/users")}
        sx={{ mb: 2 }}
        variant="outlined"
      >
        Back to Users
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, mr: 3 }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                {user.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>User ID:</strong> {user.user_id}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Type:</strong> {user.type}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong>{" "}
                <Chip label={user.status} color={user.status === 'active' ? 'success' : 'error'} size="small" />
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
            <Button variant="contained" color="success" sx={{ mt: 2 }} onClick={()=> navigate('/admin/createnotifications', { state: { userData: user } })}>
              <BackIcon sx={{ mr: 1 }} />
            Message User
            </Button>

        </CardContent>
      </Card>

      {/* User Activity Section */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            User Activity
          </Typography>
          
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Facility Bookings" icon={<FacilityIcon />} />
            <Tab label="Event History" icon={<EventIcon />} />
            <Tab label="Search History" icon={<SearchIcon />} />
            <Tab label="Usage Statistics" icon={<StatsIcon />} />
          </Tabs>

          {tabValue === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Facility</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.facility}</TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>{booking.duration}</TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          color={
                            booking.status === 'completed' ? 'success' : 
                            booking.status === 'upcoming' ? 'warning' : 'error'
                          } 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell>Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.name}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>
                        {event.attended ? (
                          <Chip label="Attended" color="success" size="small" />
                        ) : (
                          <Chip label="Not Attended" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {event.rating ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={event.rating * 20} 
                              sx={{ width: 60, mr: 1 }} 
                            />
                            {event.rating}/5
                          </Box>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Search Query</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Results Found</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchHistory.map((search) => (
                    <TableRow key={search.id}>
                      <TableCell>{search.query}</TableCell>
                      <TableCell>{search.date}</TableCell>
                      <TableCell>{search.results}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Booking Statistics
                  </Typography>
                  <Typography>Total Bookings: {userStats.bookingsCount}</Typography>
                  <Typography>Favorite Facility: {userStats.favoriteFacility}</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Event Participation
                  </Typography>
                  <Typography>Events Attended: {userStats.eventsAttended}</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Search Behavior
                  </Typography>
                  <Typography>Average Results per Search: {userStats.avgSearchResults}</Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Activity Patterns
                  </Typography>
                  <Typography>Most Active Hours: {userStats.activeHours}</Typography>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default ViewUser;