import { Button, Grid } from "@mui/material";
import RecentActivityList from "./RecentActivityList";
import { ActivityItem } from "../../types/dashboardTypes";

interface MaintenanceListProps {
  maintenance: ActivityItem[];
  loading: boolean;
  navigate: (path: string) => void;
}

const MaintenanceList = ({ 
  maintenance, 
  loading, 
  navigate 
}: MaintenanceListProps) => (
  <Grid item xs={12} md={6}>
    <RecentActivityList
      title="Maintenance Reports"
      activities={maintenance.map(item => ({
        ...item,
        statusColor: item.statusColor as "error" | "default" | "info" | "success" | "warning" | "primary" | "secondary" | undefined,
      }))}
      emptyMessage="No maintenance reports"
      loading={loading}
      viewAllLink="/maintenance"
      renderActions={(report) => (
        <Button 
          size="small" 
          variant="outlined" 
          onClick={() => navigate(`/maintenance/${report.id}`)}
        >
          View Details
        </Button>
      )}
    />
  </Grid>
);

export default MaintenanceList;