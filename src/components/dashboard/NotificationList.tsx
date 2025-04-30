import { Button, Grid } from "@mui/material";
import RecentActivityList from "./RecentActivityList";
import { ActivityItem } from "../../types/dashboardTypes";

interface NotificationListProps {
  notifications: ActivityItem[];
  loading: boolean;
  handleMarkAsRead: (id: number) => void;
  navigate: (path: string) => void;
}


const NotificationList = ({ 
  notifications, 
  loading, 
  handleMarkAsRead,
  //@ts-ignore
  navigate
}: NotificationListProps) => (
  <Grid item xs={12} md={6}>
    <RecentActivityList
      title="Recent Notifications"
      activities={notifications.map(notification => ({
        ...notification,
        statusColor: notification.statusColor as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined,
      }))}
      emptyMessage="No notifications"
      loading={loading}
      viewAllLink="/notifications"
      renderActions={(notification) => (
        !notification.rawData.read && (
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleMarkAsRead(notification.id)}
          >
            Mark as Read
          </Button>
        )
      )}
    />
  </Grid>
);

export default NotificationList;