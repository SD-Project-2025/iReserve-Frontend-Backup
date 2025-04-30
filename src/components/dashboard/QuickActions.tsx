import { Button, Card, CardContent, Typography, Box } from "@mui/material";
import { 
  SportsTennis as SportsIcon,
  Event as EventIcon,
  Build as MaintenanceIcon,
  Notifications as NotificationIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const QuickActions = ({ navigate }: { navigate: (path: string) => void }) => {
  return (
    <Grid item xs={12}>
      <Card>
        <CardContent>
          <Typography variant="h6" component="h3" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
            <Button variant="contained" startIcon={<SportsIcon />} onClick={() => navigate("/bookings/create")}>
              Book Facility
            </Button>
            <Button variant="outlined" startIcon={<EventIcon />} onClick={() => navigate("/events")}>
              Browse Events
            </Button>
            <Button
              variant="outlined"
              startIcon={<MaintenanceIcon />}
              onClick={() => navigate("/maintenance/create")}
            >
              Report Issue
            </Button>
            <Button variant="outlined" startIcon={<NotificationIcon />} onClick={() => navigate("/notifications")}>
              View Notifications
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default QuickActions;